
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-auto py-12 flex flex-col items-center justify-center bg-gradient-to-t from-black/40 to-transparent">
      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.4em] text-slate-500/60 font-bold">
          DESENVOLVIDO POR
        </span>
        <a 
          href="https://www.easybyzcreator.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="transition-all duration-700 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 active:scale-95 inline-block"
        >
          <img 
            src="https://i.ibb.co/Xf0T4snH/patitour-2026-01-27-T112542-860.png" 
            alt="Easy Byz Creator" 
            className="w-28 h-auto object-contain"
          />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
