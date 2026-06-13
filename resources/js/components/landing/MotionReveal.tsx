import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type MotionRevealProps = {
    children: ReactNode;
    className?: string;
    delay?: number;
};

export default function MotionReveal({ children, className, delay = 0 }: MotionRevealProps) {
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            className={className}
            initial={false}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay }}
        >
            {children}
        </motion.div>
    );
}
