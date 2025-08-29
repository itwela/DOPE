import { v } from "convex/values";
import { mutation, query, internalAction, internalQuery, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal, api } from "./_generated/api";

/**
 * Create an employee profile from JSON data
 */
export const createEmployeeProfile = mutation({
  args: {
    profileData: v.string(), // JSON string to parse
  },
  returns: v.id("employeeProfiles"),
  handler: async (ctx, args) => {
    try {
      const data = JSON.parse(args.profileData);
      
      // Validate required fields
      if (!data.employee_id || !data.name) {
        throw new Error("Missing required fields: employee_id and name");
      }

      // Check if employee already exists
      const existing = await ctx.db
        .query("employeeProfiles")
        .withIndex("by_employee_id", (q) => q.eq("employeeId", data.employee_id))
        .first();

      if (existing) {
        throw new Error(`Employee profile with ID ${data.employee_id} already exists`);
      }

      const now = Date.now();

      const profileId = await ctx.db.insert("employeeProfiles", {
        employeeId: data.employee_id,
        name: data.name,
        assessmentDate: data.assessment_date || "",
        all34: data.all34 || [],
        leadDomain: data.lead_domain || "",
        themeDomains: {
          Executing: data.theme_domains?.Executing || [],
          Influencing: data.theme_domains?.Influencing || [],
          RelationshipBuilding: data.theme_domains?.["Relationship Building"] || [],
          StrategyThinking: data.theme_domains?.["Strategic Thinking"] || [],
        },
        howToCoach: data.how_to_coach || "",
        bestCollabWith: data.best_collab_with || "",
        watchouts: data.watchouts || "",
        communicationTips: data.communication_tips || "",
        motivators: data.motivators || [],
        demotivators: data.demotivators || [],
        evidenceQuotes: data.evidence_quotes || [],
        sourceDocUrl: data.source_doc_url || "",
        sourceProvenance: data.source_provenance || "",
        createdAt: now,
        updatedAt: now,
      });

      // Add the employee profile to the RAG knowledge base for Steve to access
      await ctx.scheduler.runAfter(0, internal.employeeProfiles.addEmployeeToRAG, {
        profileId: profileId,
      });

      return profileId;
    } catch (error) {
      console.error("Error creating employee profile:", error);
      throw new Error(`Failed to create employee profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Get all employee profiles
 */
export const getAllEmployeeProfiles = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("employeeProfiles"),
    _creationTime: v.number(),
    employeeId: v.string(),
    name: v.string(),
    assessmentDate: v.string(),
    all34: v.array(v.string()),
    leadDomain: v.string(),
    themeDomains: v.object({
      Executing: v.array(v.string()),
      Influencing: v.array(v.string()),
      RelationshipBuilding: v.array(v.string()),
      StrategyThinking: v.array(v.string()),
    }),
    howToCoach: v.string(),
    bestCollabWith: v.string(),
    watchouts: v.string(),
    communicationTips: v.string(),
    motivators: v.array(v.string()),
    demotivators: v.array(v.string()),
    evidenceQuotes: v.array(v.object({
      quote: v.string(),
      section: v.string(),
    })),
    sourceDocUrl: v.string(),
    sourceProvenance: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query("employeeProfiles")
      .order("desc")
      .collect();

    return profiles;
  },
});

/**
 * Get a specific employee profile by ID
 */
export const getEmployeeProfile = query({
  args: {
    employeeId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("employeeProfiles"),
      _creationTime: v.number(),
      employeeId: v.string(),
      name: v.string(),
      assessmentDate: v.string(),
      all34: v.array(v.string()),
      leadDomain: v.string(),
      themeDomains: v.object({
        Executing: v.array(v.string()),
        Influencing: v.array(v.string()),
        RelationshipBuilding: v.array(v.string()),
        StrategyThinking: v.array(v.string()),
      }),
      howToCoach: v.string(),
      bestCollabWith: v.string(),
      watchouts: v.string(),
      communicationTips: v.string(),
      motivators: v.array(v.string()),
      demotivators: v.array(v.string()),
      evidenceQuotes: v.array(v.object({
        quote: v.string(),
        section: v.string(),
      })),
      sourceDocUrl: v.string(),
      sourceProvenance: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("employeeProfiles")
      .withIndex("by_employee_id", (q) => q.eq("employeeId", args.employeeId))
      .first();

    return profile || null;
  },
});

/**
 * Delete an employee profile
 */
export const deleteEmployeeProfile = mutation({
  args: {
    profileId: v.id("employeeProfiles"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get the profile before deleting to get the employeeId for RAG cleanup
    const profile = await ctx.db.get(args.profileId);
    
    await ctx.db.delete(args.profileId);
    
    // Remove the employee profile from the RAG knowledge base
    if (profile) {
      await ctx.scheduler.runAfter(0, internal.employeeProfiles.removeEmployeeFromRAG, {
        employeeId: profile.employeeId,
        profileId: args.profileId,
      });
    }
    
    return null;
  },
});

/**
 * Update an employee profile
 */
export const updateEmployeeProfile = mutation({
  args: {
    profileId: v.id("employeeProfiles"),
    profileData: v.string(), // JSON string to parse
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const data = JSON.parse(args.profileData);
      const now = Date.now();

      await ctx.db.patch(args.profileId, {
        employeeId: data.employee_id,
        name: data.name,
        assessmentDate: data.assessment_date || "",
        all34: data.all34 || [],
        leadDomain: data.lead_domain || "",
        themeDomains: {
          Executing: data.theme_domains?.Executing || [],
          Influencing: data.theme_domains?.Influencing || [],
          RelationshipBuilding: data.theme_domains?.["Relationship Building"] || [],
          StrategyThinking: data.theme_domains?.["Strategic Thinking"] || [],
        },
        howToCoach: data.how_to_coach || "",
        bestCollabWith: data.best_collab_with || "",
        watchouts: data.watchouts || "",
        communicationTips: data.communication_tips || "",
        motivators: data.motivators || [],
        demotivators: data.demotivators || [],
        evidenceQuotes: data.evidence_quotes || [],
        sourceDocUrl: data.source_doc_url || "",
        sourceProvenance: data.source_provenance || "",
        updatedAt: now,
      });

      // Update the employee profile in the RAG knowledge base
      await ctx.scheduler.runAfter(0, internal.employeeProfiles.updateEmployeeInRAG, {
        profileId: args.profileId,
      });

      return null;
    } catch (error) {
      console.error("Error updating employee profile:", error);
      throw new Error(`Failed to update employee profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Internal action to add employee profile to RAG knowledge base
 */
export const addEmployeeToRAG = internalAction({
  args: {
    profileId: v.id("employeeProfiles"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get the employee profile
    const profile = await ctx.runQuery(internal.employeeProfiles.getEmployeeProfileInternal, {
      profileId: args.profileId,
    });

    if (!profile) {
      console.error("Employee profile not found for RAG insertion:", args.profileId);
      return null;
    }

    // Format the profile data as a comprehensive knowledge entry for the RAG system
    const content = `Employee Profile: ${profile.name}

Employee ID: ${profile.employeeId}
Assessment Date: ${profile.assessmentDate}
Lead Domain: ${profile.leadDomain}

TOP 10 STRENGTHS:
${profile.all34.map((strength: string, index: number) => `${index + 1}. ${strength}`).join('\n')}

HOW TO COACH:
${profile.howToCoach}

COMMUNICATION TIPS:
${profile.communicationTips}

BEST COLLABORATION:
${profile.bestCollabWith}

WATCHOUTS:
${profile.watchouts}

MOTIVATORS:
${profile.motivators.map((motivator: string) => `• ${motivator}`).join('\n')}

DEMOTIVATORS:
${profile.demotivators.map((demotivator: string) => `• ${demotivator}`).join('\n')}

THEME DOMAINS:
• Executing: ${profile.themeDomains.Executing.join(', ')}
• Influencing: ${profile.themeDomains.Influencing.join(', ')}
• Relationship Building: ${profile.themeDomains.RelationshipBuilding.join(', ')}
• Strategic Thinking: ${profile.themeDomains.StrategyThinking.join(', ')}

EVIDENCE QUOTES:
${profile.evidenceQuotes.map((quote: any) => `"${quote.quote}" - ${quote.section}`).join('\n\n')}

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
      insertedAt: Date.now(),
    };

    try {
      // Add to the RAG knowledge base using the same namespace Steve searches
      await ctx.runAction(api.knowledgeBase.insertDataIntoKnowledgeBase, {
        namespace: "role-guidance",
        title: title,
        text: content,
        metadata: metadata,
        key: `employee_${profile.employeeId}_${profile._id}`,
        importance: 1.0,
      });

      console.log(`Successfully added employee ${profile.name} to RAG knowledge base`);
    } catch (error) {
      console.error(`Failed to add employee ${profile.name} to RAG:`, error);
    }

    return null;
  },
});

/**
 * Internal query to get employee profile for RAG operations
 */
export const getEmployeeProfileInternal = internalQuery({
  args: {
    profileId: v.id("employeeProfiles"),
  },
  returns: v.union(
    v.object({
      _id: v.id("employeeProfiles"),
      _creationTime: v.number(),
      employeeId: v.string(),
      name: v.string(),
      assessmentDate: v.string(),
      all34: v.array(v.string()),
      leadDomain: v.string(),
      themeDomains: v.object({
        Executing: v.array(v.string()),
        Influencing: v.array(v.string()),
        RelationshipBuilding: v.array(v.string()),
        StrategyThinking: v.array(v.string()),
      }),
      howToCoach: v.string(),
      bestCollabWith: v.string(),
      watchouts: v.string(),
      communicationTips: v.string(),
      motivators: v.array(v.string()),
      demotivators: v.array(v.string()),
      evidenceQuotes: v.array(v.object({
        quote: v.string(),
        section: v.string(),
      })),
      sourceDocUrl: v.string(),
      sourceProvenance: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.profileId);
  },
});

/**
 * Internal action to update employee profile in RAG knowledge base
 */
export const updateEmployeeInRAG = internalAction({
  args: {
    profileId: v.id("employeeProfiles"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get the updated employee profile
    const profile = await ctx.runQuery(internal.employeeProfiles.getEmployeeProfileInternal, {
      profileId: args.profileId,
    });

    if (!profile) {
      console.error("Employee profile not found for RAG update:", args.profileId);
      return null;
    }

    try {
      // First, try to delete the old entry using the key pattern
      const oldKey = `employee_${profile.employeeId}_${profile._id}`;
      
        // Search for existing entries to get the entryId for deletion
      const searchResult = await ctx.runAction(api.knowledgeBase.searchKnowledgeBase, {
        namespace: "role-guidance",
        query: `Employee Profile: ${profile.name}`,
        limit: 5,
      });

      // Find and delete the old entry that matches this employee
      for (const result of searchResult.results) {
        if (result.metadata?.sourceProfileId === profile._id) {
          await ctx.runAction(api.knowledgeBase.deleteFromKnowledgeBase, {
            entryId: result.entryId,
          });
          console.log(`Deleted old RAG entry for employee ${profile.name}`);
          break;
        }
      }

      // Add the updated profile (reuse the same logic as addEmployeeToRAG)
      const content = `Employee Profile: ${profile.name}

Employee ID: ${profile.employeeId}
Assessment Date: ${profile.assessmentDate}
Lead Domain: ${profile.leadDomain}

TOP ALL 34 STRENGTHS:
${profile.all34.map((strength: string, index: number) => `${index + 1}. ${strength}`).join('\n')}

HOW TO COACH:
${profile.howToCoach}

COMMUNICATION TIPS:
${profile.communicationTips}

BEST COLLABORATION:
${profile.bestCollabWith}

WATCHOUTS:
${profile.watchouts}

MOTIVATORS:
${profile.motivators.map((motivator: string) => `• ${motivator}`).join('\n')}

DEMOTIVATORS:
${profile.demotivators.map((demotivator: string) => `• ${demotivator}`).join('\n')}

THEME DOMAINS:
• Executing: ${profile.themeDomains.Executing.join(', ')}
• Influencing: ${profile.themeDomains.Influencing.join(', ')}
• Relationship Building: ${profile.themeDomains.RelationshipBuilding.join(', ')}
• Strategic Thinking: ${profile.themeDomains.StrategyThinking.join(', ')}

EVIDENCE QUOTES:
${profile.evidenceQuotes.map((quote: any) => `"${quote.quote}" - ${quote.section}`).join('\n\n')}

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
        updatedAt: Date.now(),
      };

        // Add the updated entry
      await ctx.runAction(api.knowledgeBase.insertDataIntoKnowledgeBase, {
        namespace: "role-guidance",
        title: title,
        text: content,
        metadata: metadata,
        key: `employee_${profile.employeeId}_${profile._id}_updated_${Date.now()}`,
        importance: 1.0,
      });

      console.log(`Successfully updated employee ${profile.name} in RAG knowledge base`);
    } catch (error) {
      console.error(`Failed to update employee ${profile.name} in RAG:`, error);
    }

    return null;
  },
});

/**
 * Internal action to remove employee profile from RAG knowledge base
 */
export const removeEmployeeFromRAG = internalAction({
  args: {
    employeeId: v.string(),
    profileId: v.id("employeeProfiles"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
        // Search for the employee's entry in the RAG system
      const searchResult = await ctx.runAction(api.knowledgeBase.searchKnowledgeBase, {
        namespace: "role-guidance",
        query: `employeeId: ${args.employeeId}`,
        limit: 10,
      });

      // Find and delete entries that match this employee profile
      for (const result of searchResult.results) {
        if (result.metadata?.sourceProfileId === args.profileId || 
            result.metadata?.employeeId === args.employeeId) {
          await ctx.runAction(api.knowledgeBase.deleteFromKnowledgeBase, {
            entryId: result.entryId,
          });
          console.log(`Deleted RAG entry for employee ${args.employeeId}: ${result.entryId}`);
        }
      }

      console.log(`Successfully removed employee ${args.employeeId} from RAG knowledge base`);
    } catch (error) {
      console.error(`Failed to remove employee ${args.employeeId} from RAG:`, error);
    }

    return null;
  },
});

/**
 * Utility action to backfill existing employees into RAG system
 * This can be called manually to add all existing employees to the knowledge base
 */
export const backfillEmployeesToRAG = action({
  args: {},
  returns: v.object({
    processed: v.number(),
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Get all existing employee profiles
      const profiles = await ctx.runQuery(api.employeeProfiles.getAllEmployeeProfiles, {});
      
      let processed = 0;
      
      for (const profile of profiles) {
        try {
          // Use the internal action to add each employee to RAG
          await ctx.runAction(internal.employeeProfiles.addEmployeeToRAG, {
            profileId: profile._id,
          });
          processed++;
          console.log(`Added employee ${profile.name} to RAG knowledge base`);
        } catch (error) {
          console.error(`Failed to add employee ${profile.name} to RAG:`, error);
        }
      }
      
      return {
        processed,
        success: true,
        message: `Successfully processed ${processed} employee profiles into RAG system`,
      };
    } catch (error) {
      console.error("Error during backfill:", error);
      return {
        processed: 0,
        success: false,
        message: `Failed to backfill employees: ${error}`,
      };
    }
  },
});
