'use client';
import { motion } from "framer-motion";
import { usePostcard } from "../providers/PostcardProvider";
import Image from "next/image";

export default function DopePostCard() {
    const { postcard } = usePostcard();

    return (
        <motion.div 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}  
        className="
        lg:w-[900px] lg:h-[600px]
        sm:w-[450px] sm:h-[300px]
        aspect[3/2]
        bg-white rounded-lg">
            {postcard?.imageUrl && (
                <Image src={postcard?.imageUrl} alt="Postcard" className="w-full h-full object-cover" width={1000} height={1000} />
            )}
        </motion.div>
    )
}