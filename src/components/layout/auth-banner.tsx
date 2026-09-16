
'use client';

import Image from "next/image";
import { XavefLogoText } from "../icons";

export function AuthBanner() {
    return (
        <div className="hidden md:flex md:w-1/2 bg-muted/40 p-8 flex-col justify-between">
            <XavefLogoText />
            <div className="relative w-full aspect-square max-w-lg mx-auto">
                 <Image 
                    src="https://picsum.photos/seed/1/800/800" 
                    alt="Abstract financial background"
                    fill
                    className="rounded-lg"
                    data-ai-hint="abstract finance"
                />
            </div>
            <div className="text-center">
                <h2 className="text-xl font-semibold">Your Partner in Financial Success</h2>
                <p className="text-muted-foreground mt-2">
                    Save, manage, and grow your money with confidence.
                </p>
            </div>
        </div>
    )
}
