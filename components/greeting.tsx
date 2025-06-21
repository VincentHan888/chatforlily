import { motion } from 'framer-motion';

export function Greeting() {
  return (
    <div
      data-testid="greeting"
      className="max-w-3xl mx-auto md:mt-20 px-4 sm:px-8 size-full flex flex-col justify-center"
    >
      <div className="flex flex-col gap-2 leading-relaxed text-center max-w-xl">
        <p className="font-medium">Hello,Lily!</p>
        <p className="text-muted-foreground"></p>
      </div>
    </div>
  );
}
