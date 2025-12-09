import { motion } from "framer-motion";
import { useMemo } from "react";

export function SectionFadeIn({ children, className = "", id }) {
	// Check if mobile on initial render only (no resize listener for better performance)
	const isMobile = useMemo(() => {
		if (typeof window === "undefined") return false;
		return window.innerWidth < 768;
	}, []);

	// On mobile: disable animations for better performance - just render immediately
	if (isMobile) {
		return (
			<section id={id} className={className}>
				{children}
			</section>
		);
	}

	// Desktop: use Framer Motion animations
	return (
		<motion.section
			id={id}
			initial={{ opacity: 0, y: 30 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, amount: 0.3, margin: "0px 0px -50px 0px" }}
			transition={{ duration: 0.6, ease: "easeOut" }}
			className={className}
			style={{ willChange: "opacity, transform" }}
		>
			{children}
		</motion.section>
	);
}

