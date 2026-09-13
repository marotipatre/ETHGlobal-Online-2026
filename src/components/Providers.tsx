"use client";

import { ReactNode } from "react";
import dynamic from "next/dynamic";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();
const RainbowKitWrapper = dynamic(() => import("./RainbowKitWrapper").then((module) => module.RainbowKitWrapper), { ssr: false });

interface ProvidersProps {
    children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    return (
        <QueryClientProvider client={queryClient}>
            <RainbowKitWrapper>
                {children}
            </RainbowKitWrapper>
        </QueryClientProvider>
    );
}
