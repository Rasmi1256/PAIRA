import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaHeart, FaDove } from 'react-icons/fa';

const icons = [
  { icon: FaHeart, color: 'text-red-300/50' },
  { icon: FaDove, color: 'text-blue-200/50' },
  { icon: FaHeart, color: 'text-pink-300/50' },
  { icon: FaDove, color: 'text-gray-200/50' },
  { icon: FaHeart, color: 'text-red-400/50' },
  { icon: FaDove, color: 'text-indigo-200/50' },
  { icon: FaHeart, color: 'text-pink-400/50' },
  { icon: FaDove, color: 'text-blue-100/50' },
];

const FloatingIcons: React.FC = () => {
  const [iconProps] = useState(() =>
    icons.map(() => ({
      duration: Math.random() * 20 + 15, // 15 to 35 seconds
      delay: Math.random() * 10, // 0 to 10 seconds
      startY: Math.random() * 100,
      startX: Math.random() * 100,
      size: Math.random() * 40 + 20, // 20px to 60px
      endX: Math.random() * 100,
      endY: Math.random() * 100,
      rotate: Math.random() * 360,
    }))
  );

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none" aria-hidden="true">
      {icons.map((item, i) => {
        const props = iconProps[i];

        return (
          <motion.div
            key={i}
            initial={{ x: `${props.startX}vw`, y: `${props.startY}vh`, opacity: 0, scale: 0.5 }}
            animate={{
              x: `${props.endX}vw`,
              y: `${props.endY}vh`,
              opacity: [0, 1, 1, 0],
              scale: 1,
              rotate: props.rotate,
            }}
            transition={{
              duration: props.duration,
              delay: props.delay,
              repeat: Infinity,
              repeatType: 'loop',
              ease: 'linear',
            }}
            className={`${item.color} absolute`}
            style={{ fontSize: `${props.size}px`, willChange: 'transform, opacity' }}
          >
            <item.icon />
          </motion.div>
        );
      })}
    </div>
  );
};

export default FloatingIcons;