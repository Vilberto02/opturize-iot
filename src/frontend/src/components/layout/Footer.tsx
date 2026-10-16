import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 bg-white border-t border-slate-200/80 py-8 text-sm text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <section className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <span className="font-semibold text-slate-700">OpTurize</span>
        </section>

        <section className="text-center md:text-right">
          <p className="text-slate-600">
            {(new Date()).getFullYear()}. Todos los derechos reservados.
          </p>
        </section>
      </div>
    </footer>
  );
};
