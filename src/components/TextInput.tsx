'use client';

import { useState, ChangeEvent, FormEvent } from 'react';

interface TextInputProps {
  onSubmit: (text: string) => void;
}

export default function TextInput({ onSubmit }: TextInputProps) {
  const [text, setText] = useState('');

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-gray-400 focus-within:border-transparent">
        <textarea
          value={text}
          onChange={handleChange}
          placeholder="Describe your meal in detail (e.g., 'grilled chicken breast with steamed broccoli and brown rice')"
          className="w-full p-4 h-32 resize-none focus:outline-none"
          required
        />
      </div>
      
      <button
        type="submit"
        className={`w-full py-3 rounded-lg flex items-center justify-center ${
          text.trim() 
            ? 'bg-gray-800 text-white hover:bg-gray-900' 
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
        disabled={!text.trim()}
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Estimate calories
      </button>
    </form>
  );
} 