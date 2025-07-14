'use client';

import DopeLogo from "../../public/dopelogo.svg";
import Image from "next/image";
import { usePostcard } from "../providers/PostcardProvider";


export default function DopeHeader() {

    const { wantsToGeneratePostcard, setWantsToGeneratePostcard} = usePostcard();


    return (
        <>
            <div onClick={() => setWantsToGeneratePostcard(false)} className="absolute top-0 left-0 flex flex-row px-6 py-3 gap-4 items-center justify-center">
                <Image src={DopeLogo} alt="Dope Logo" className=" w-[40px] h-[40px] select-none" />
                <h1 className="text-xl font-bold select-none">Postcard Machine</h1>
            </div>
        </>
    )
}