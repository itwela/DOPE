import { v } from "convex/values";
import { action, mutation, query, internalMutation } from "./_generated/server";
import { RAG } from "@convex-dev/rag";
import { components, internal } from "./_generated/api";
import { openai } from "@ai-sdk/openai";
import { Id } from "./_generated/dataModel";

// Initialize RAG instance
export const rag = new RAG(components.rag, {
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
  embeddingDimension: 1536,
});

/**
 * Insert data into the knowledge base using RAG
 * This function processes and stores text data with embeddings for semantic search
 */
export const insertDataIntoKnowledgeBase = action({
  args: {
    namespace: v.string(), // Knowledge base namespace (e.g., "agent-knowledge", "user-docs")
    title: v.optional(v.string()), // Optional title for the document
    text: v.string(), // The text content to be stored
    metadata: v.optional(v.record(v.string(), v.any())), // Use record type like RAG expects
    agentId: v.optional(v.id("agents")), // Associate with specific agent
    key: v.optional(v.string()), // Unique key to prevent duplicates
    importance: v.optional(v.number()), // Importance score (0-1, default 1)
  },
  returns: v.object({
    entryId: v.string(),
    status: v.union(v.literal("ready"), v.literal("pending"), v.literal("replaced")),
    created: v.boolean(),
    replacedEntry: v.any(), // RAG returns complex Entry type
  }),
  handler: async (ctx, args) => {
    const {
      namespace,
      title,
      text,
      metadata = {},
      agentId,
      key,
      importance = 1.0,
    } = args;

    // Validate text length
    if (text.length === 0) {
      throw new Error("Text content cannot be empty");
    }

    if (text.length > 100000) { // 100KB limit
      throw new Error("Text content is too large. Maximum 100,000 characters allowed.");
    }

    // Enhance metadata with additional fields - ensure all values are serializable
    const enhancedMetadata: Record<string, any> = {};
    
    // Copy original metadata, ensuring all values are valid Convex types
    if (metadata) {
      for (const [key, value] of Object.entries(metadata)) {
        enhancedMetadata[key] = value;
      }
    }
    
    // Add system fields
    enhancedMetadata.insertedAt = Date.now();
    enhancedMetadata.textLength = text.length;
    
    // Only add agentId if it exists
    if (agentId) {
      enhancedMetadata.agentId = agentId.toString();
    }
    
    console.log('Final metadata structure:', enhancedMetadata);
    console.log('Metadata keys:', Object.keys(enhancedMetadata));
    console.log('Metadata values:', Object.values(enhancedMetadata));

    // Generate content hash for deduplication
    const contentHash = await generateContentHash(text);

    try {
      // Insert the data using RAG
      const result = await rag.add(ctx, {
        namespace: namespace,
        text: text,
        title: title,
        metadata: enhancedMetadata,
        key: key || `doc_${contentHash}_${Date.now()}`,
        contentHash: contentHash,
        importance,
      });

      console.log(`Successfully inserted into knowledge base: ${result.entryId}`);
      console.log('Metadata being stored:', enhancedMetadata);
      console.log('Result from RAG.add:', result);
      
      return result;
    } catch (error) {
      console.error("Error inserting into knowledge base:", error);
      throw new Error(`Failed to insert data into knowledge base: ${error}`);
    }
  },
});

/**
 * Search the knowledge base using semantic search
 */
export const searchKnowledgeBase = action({
  args: {
    namespace: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
    agentId: v.optional(v.id("agents")),
    vectorScoreThreshold: v.optional(v.number()), // Minimum similarity score
  },
  returns: v.object({
    results: v.array(v.object({
      entryId: v.string(),
      title: v.optional(v.string()),
      text: v.string(),
      textPreview: v.string(), // First 20 words preview
      score: v.number(),
      metadata: v.optional(v.record(v.string(), v.any())),
    })),
    text: v.string(), // Combined text from all results
  }),
  handler: async (ctx, args) => {
    const {
      namespace,
      query,
      limit = 10,
      agentId,
      vectorScoreThreshold = 0.7,
    } = args;

    console.log('Search parameters:', { namespace, query, limit, vectorScoreThreshold, agentId });

    try {
      const searchResult = await rag.search(ctx, {
        namespace: namespace,
        query: query,
        limit: limit,
        vectorScoreThreshold: vectorScoreThreshold,
      });

      console.log('Search result:', searchResult);

      // console.log('Raw search result from RAG:', searchResult);
    //   console.log('Number of entries found:', searchResult.entries?.length || 0);

      // Format results with actual scores
      let formattedResults = searchResult.entries.map((entry, index) => {
        // Get the actual score from the search results array
        const actualScore = searchResult.results && searchResult.results[index] 
          ? searchResult.results[index].score 
          : 0;
        
        // Get first 20 words for preview
        const words = entry.text.split(' ').slice(0, 20).join(' ');
        const textPreview = words + (entry.text.split(' ').length > 20 ? '...' : '');
        
        console.log(`Entry ${index + 1}:`);
        console.log(`  Score: ${actualScore}`);
        console.log(`  Title: ${entry.title}`);
        console.log(`  Preview: ${textPreview}`);
        console.log(`  Full length: ${entry.text.length} chars`);
        
        return {
          entryId: entry.entryId,
          title: entry.title,
          text: entry.text,
          textPreview, // Add preview for easier reading
          score: actualScore, // Use actual score from RAG
          metadata: entry.metadata,
        };
      });

      // Filter by agentId if specified
      if (agentId) {
        formattedResults = formattedResults.filter(
          (entry) => entry.metadata?.agentId === agentId.toString()
        );
      }

      // Log score summary
    //   if (formattedResults.length > 0) {
    //     const scores = formattedResults.map(r => r.score);
    //     const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    //     const maxScore = Math.max(...scores);
    //     const minScore = Math.min(...scores);
        
    //     console.log('\n📊 SCORE SUMMARY:');
    //     console.log(`  Total results: ${formattedResults.length}`);
    //     console.log(`  Average score: ${avgScore.toFixed(3)}`);
    //     console.log(`  Best score: ${maxScore.toFixed(3)}`);
    //     console.log(`  Worst score: ${minScore.toFixed(3)}`);
    //     console.log(`  Query: "${query}"`);
    //   }

      return {
        results: formattedResults,
        text: searchResult.text,
      };

    } catch (error) {
      console.error("Error searching knowledge base:", error);
      throw new Error(`Failed to search knowledge base: ${error}`);
    }
  },
});

/**
 * Delete an entry from the knowledge base
 */
export const deleteFromKnowledgeBase = action({
  args: {
    entryId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      // Cast entryId to the proper type expected by RAG
      await rag.delete(ctx, { entryId: args.entryId as any });
      console.log(`Deleted entry from knowledge base: ${args.entryId}`);
      return null;
    } catch (error) {
      console.error("Error deleting from knowledge base:", error);
      throw new Error(`Failed to delete from knowledge base: ${error}`);
    }
  },
});

/**
 * List entries in a namespace with pagination
 */
export const listKnowledgeBaseEntries = action({
  args: {
    namespace: v.string(),
    limit: v.optional(v.number()),
    agentId: v.optional(v.id("agents")),
  },
  returns: v.object({
    entries: v.array(v.object({
      entryId: v.string(),
      title: v.optional(v.string()),
      metadata: v.optional(v.record(v.string(), v.any())),
      status: v.string(),
    })),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const { namespace, limit = 50 } = args;

    try {
      // Get the namespace first
      const namespaceResult = await rag.getNamespace(ctx, { namespace });
      
      if (!namespaceResult) {
        return { entries: [], isDone: true };
      }

      // List entries in the namespace
      const result = await rag.list(ctx, {
        namespaceId: namespaceResult.namespaceId,
        limit,
        status: "ready",
      });

      // Format entries and filter by agentId if specified
      let formattedEntries = result.page.map((entry) => ({
        entryId: entry.entryId,
        title: entry.title,
        metadata: entry.metadata,
        status: entry.status,
      }));

      console.log('Raw RAG list result:', result.page.slice(0, 2)); // Log first 2 entries
      console.log('Formatted entries:', formattedEntries.slice(0, 2));

      // Filter by agentId in metadata if specified
      if (args.agentId) {
        formattedEntries = formattedEntries.filter(
          (entry) => entry.metadata?.agentId === args.agentId!.toString()
        );
      }

      return {
        entries: formattedEntries,
        isDone: result.isDone,
      };
    } catch (error) {
      console.error("Error listing knowledge base entries:", error);
      throw new Error(`Failed to list knowledge base entries: ${error}`);
    }
  },
});

/**
 * Clear all entries from a knowledge base namespace for a specific agent
 */
export const clearKnowledgeBase = action({
  args: {
    namespace: v.string(),
    agentId: v.optional(v.id("agents")),
  },
  returns: v.object({
    deletedCount: v.number(),
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const { namespace, agentId } = args;

    try {
      // Get the namespace first
      const namespaceResult = await rag.getNamespace(ctx, { namespace });
      
      if (!namespaceResult) {
        return { deletedCount: 0, success: true };
      }

      let deletedCount = 0;
      let hasMore = true;
      
      // Keep fetching and deleting entries until all are cleared
      while (hasMore) {
        // List entries in the namespace
        const result = await rag.list(ctx, {
          namespaceId: namespaceResult.namespaceId,
          limit: 50, // Process in batches
          status: "ready",
        });

        // Filter by agentId if specified
        let entriesToDelete = result.page;
        if (agentId) {
          entriesToDelete = result.page.filter(
            (entry) => entry.metadata?.agentId === agentId.toString()
          );
        }

        // Delete all entries in this batch
        for (const entry of entriesToDelete) {
          try {
            await rag.delete(ctx, { entryId: entry.entryId });
            deletedCount++;
            console.log(`Deleted entry: ${entry.entryId}`);
          } catch (deleteError) {
            console.error(`Failed to delete entry ${entry.entryId}:`, deleteError);
            // Continue with other entries even if one fails
          }
        }

        // Check if there are more entries to process
        hasMore = !result.isDone && result.page.length > 0;
        
        // If we're filtering by agentId and found no matching entries, 
        // but there are still more entries overall, continue searching
        if (agentId && entriesToDelete.length === 0 && hasMore) {
          // If no entries matched the agentId in this batch,
          // we might need to continue searching through more batches
          // For simplicity, we'll break here to avoid infinite loops
          // In a production system, you might want to implement cursor-based pagination
          hasMore = false;
        }
      }

      console.log(`Successfully cleared ${deletedCount} entries from knowledge base namespace: ${namespace}`);
      
      return {
        deletedCount,
        success: true,
      };
    } catch (error) {
      console.error("Error clearing knowledge base:", error);
      throw new Error(`Failed to clear knowledge base: ${error}`);
    }
  },
});

/**
 * Test function to verify metadata storage
 */
export const testMetadataStorage = action({
  args: {
    namespace: v.string(),
  },
  returns: v.object({
    entryId: v.string(),
    status: v.string(),
  }),
  handler: async (ctx, args) => {
    const testMetadata: Record<string, any> = {
      testField: "testValue",
      category: "test", 
      source: "manual",
      timestamp: Date.now().toString(), // Convert to string to avoid any number issues
    };

    console.log('Testing metadata storage with:', testMetadata);
    console.log('Metadata type check:');
    for (const [key, value] of Object.entries(testMetadata)) {
      console.log(`  ${key}: ${typeof value} = ${value}`);
    }

    const contentHash = await generateContentHash("This is a test document to verify metadata storage.");

    try {
      const result = await rag.add(ctx, {
        namespace: args.namespace,
        text: "This is a test document to verify metadata storage.",
        title: "Metadata Test Document",
        metadata: testMetadata,
        key: `test_metadata_${Date.now()}`,
        contentHash: contentHash,
        importance: 1.0,
      });

      console.log('Test result:', result);
      return {
        entryId: result.entryId,
        status: result.status,
      };
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  },
});

/**
 * Create a text-based knowledge base entry
 */
export const createTextEntry = action({
  args: {
    agentId: v.id("agents"),
    title: v.string(),
    content: v.string(),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  returns: v.id("knowledgeBaseEntries"),
  handler: async (ctx, args): Promise<Id<"knowledgeBaseEntries">> => {
    const now = Date.now();
    
    const contentHash = await generateContentHash(args.content);
    
    // Use internal mutation to insert into database
    const entryId: Id<"knowledgeBaseEntries"> = await ctx.runMutation(internal.knowledgeBase.createTextEntryInternal, {
      agentId: args.agentId,
      title: args.title,
      content: args.content,
      metadata: args.metadata || {},
      contentHash: contentHash,
      createdAt: now,
      updatedAt: now,
    });

    await rag.add(ctx, {
      namespace: "dope-marketing-knowledge",
      text: args.content,
      title: args.title,
      metadata: args.metadata || {},
      key: `doc_${contentHash}_${Date.now()}`,
      contentHash: contentHash,
      importance: 1.0,
    });

    return entryId;
  },
});

/**
 * Internal mutation to create text entry in database
 */
export const createTextEntryInternal = internalMutation({
  args: {
    agentId: v.id("agents"),
    title: v.string(),
    content: v.string(),
    metadata: v.record(v.string(), v.any()),
    contentHash: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  returns: v.id("knowledgeBaseEntries"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("knowledgeBaseEntries", {
      agentId: args.agentId,
      type: "text",
      title: args.title,
      content: args.content,
      metadata: args.metadata,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
    });
  },
});

/**
 * Create a knowledge base entry from an employee profile
 */
export const createEmployeeProfileEntry = mutation({
  args: {
    agentId: v.id("agents"),
    employeeProfileId: v.id("employeeProfiles"),
  },
  returns: v.id("knowledgeBaseEntries"),
  handler: async (ctx, args) => {
    // Get the employee profile
    const profile = await ctx.db.get(args.employeeProfileId);
    if (!profile) {
      throw new Error("Employee profile not found");
    }

    const now = Date.now();
    
    // Format the profile data as a comprehensive knowledge entry
    const content = `Employee Profile: ${profile.name}

Employee ID: ${profile.employeeId}
Assessment Date: ${profile.assessmentDate}
Lead Domain: ${profile.leadDomain}

TOP 10 STRENGTHS:
${profile.all34.map((strength, index) => `${index + 1}. ${strength}`).join('\n')}

HOW TO COACH:
${profile.howToCoach}

COMMUNICATION TIPS:
${profile.communicationTips}

BEST COLLABORATION:
${profile.bestCollabWith}

WATCHOUTS:
${profile.watchouts}

MOTIVATORS:
${profile.motivators.map(motivator => `• ${motivator}`).join('\n')}

DEMOTIVATORS:
${profile.demotivators.map(demotivator => `• ${demotivator}`).join('\n')}

THEME DOMAINS:
• Executing: ${profile.themeDomains.Executing.join(', ')}
• Influencing: ${profile.themeDomains.Influencing.join(', ')}
• Relationship Building: ${profile.themeDomains.RelationshipBuilding.join(', ')}
• Strategic Thinking: ${profile.themeDomains.StrategyThinking.join(', ')}

EVIDENCE QUOTES:
${profile.evidenceQuotes.map(quote => `"${quote.quote}" - ${quote.section}`).join('\n\n')}

SOURCE:
${profile.sourceProvenance}
Document: ${profile.sourceDocUrl}`;

    const title = `Employee Profile: ${profile.name}`;
    
    const metadata = {
      type: "employee_profile",
      employeeId: profile.employeeId,
      employeeName: profile.name,
      leadDomain: profile.leadDomain,
      sourceProfileId: profile._id,
    };

    const entryId = await ctx.db.insert("knowledgeBaseEntries", {
      agentId: args.agentId,
      type: "text",
      title: title,
      content: content,
      metadata: metadata,
      createdAt: now,
      updatedAt: now,
    });

    return entryId;
  },
});

/**
 * Create a file-based knowledge base entry (internal)
 */
export const createFileEntryInternal = internalMutation({
  args: {
    agentId: v.id("agents"),
    title: v.string(),
    fileId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  returns: v.id("knowledgeBaseEntries"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const entryId = await ctx.db.insert("knowledgeBaseEntries", {
      agentId: args.agentId,
      type: "file",
      title: args.title,
      fileId: args.fileId,
      fileName: args.fileName,
      fileType: args.fileType,
      metadata: args.metadata || {},
      createdAt: now,
      updatedAt: now,
    });

    return entryId;
  },
});

/**
 * Create a file-based knowledge base entry (public)
 */
export const createFileEntry = mutation({
  args: {
    agentId: v.id("agents"),
    title: v.string(),
    fileId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  returns: v.id("knowledgeBaseEntries"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const entryId = await ctx.db.insert("knowledgeBaseEntries", {
      agentId: args.agentId,
      type: "file",
      title: args.title,
      fileId: args.fileId,
      fileName: args.fileName,
      fileType: args.fileType,
      metadata: args.metadata || {},
      createdAt: now,
      updatedAt: now,
    });

    return entryId;
  },
});

/**
 * Get all knowledge base entries for an agent
 */
export const getKnowledgeBaseEntries = query({
  args: {
    agentId: v.id("agents"),
  },
  returns: v.array(v.object({
    _id: v.id("knowledgeBaseEntries"),
    _creationTime: v.number(),
    agentId: v.id("agents"),
    type: v.union(v.literal("file"), v.literal("text")),
    title: v.string(),
    content: v.optional(v.string()),
    fileId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    ragEntryId: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.any())),
    createdAt: v.number(),
    updatedAt: v.number(),
    preview: v.string(), // First 20 words for text, filename for files
  })),
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("knowledgeBaseEntries")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .collect();

    return entries.map((entry) => {
      let preview = "";
      if (entry.type === "text" && entry.content) {
        const words = entry.content.split(" ").slice(0, 20).join(" ");
        preview = words + (entry.content.split(" ").length > 20 ? "..." : "");
      } else if (entry.type === "file" && entry.fileName) {
        preview = entry.fileName;
      }

      return {
        ...entry,
        preview,
      };
    });
  },
});

/**
 * Delete a knowledge base entry
 */
export const deleteKnowledgeBaseEntry = mutation({
  args: {
    entryId: v.id("knowledgeBaseEntries"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("Entry not found");
    }

    // If it's a file entry, delete the file from storage
    if (entry.type === "file" && entry.fileId) {
      await ctx.storage.delete(entry.fileId);
    }

    // Delete the database entry
    await ctx.db.delete(args.entryId);
    
    return null;
  },
});

/**
 * Upload file and create file entry
 */
export const uploadFileAndCreateEntry = action({
  args: {
    agentId: v.id("agents"),
    title: v.string(),
    file: v.any(), // File data
    fileName: v.string(),
    fileType: v.string(),
  },
  returns: v.id("knowledgeBaseEntries"),
  handler: async (ctx, args) => {
    // Store the file
    const blob = new Blob([args.file]);
    const fileId = await ctx.storage.store(blob);
    
    // Create the entry using internal mutation
    const entryId: Id<"knowledgeBaseEntries"> = await ctx.runMutation(internal.knowledgeBase.createFileEntryInternal, {
      agentId: args.agentId,
      title: args.title,
      fileId,
      fileName: args.fileName,
      fileType: args.fileType,
    });

    return entryId;
  },
});

/**
 * Generate a simple content hash for deduplication
 */
async function generateContentHash(text: string): Promise<string> {
  // Simple hash function - in production, you might want to use a proper crypto hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
