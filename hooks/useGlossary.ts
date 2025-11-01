import { useState, useEffect, useCallback } from 'react';
import { GlossaryTerm } from '../types';

const GLOSSARY_KEY = 'teachback_glossary_v1';

export const useGlossary = () => {
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);

  useEffect(() => {
    try {
      const savedGlossary = localStorage.getItem(GLOSSARY_KEY);
      if (savedGlossary) {
        setGlossary(JSON.parse(savedGlossary));
      }
    } catch (error) {
      console.error("Failed to load glossary from localStorage", error);
    }
  }, []);

  const saveGlossary = (newGlossary: GlossaryTerm[]) => {
    try {
      localStorage.setItem(GLOSSARY_KEY, JSON.stringify(newGlossary));
      setGlossary(newGlossary);
    } catch (error) {
      console.error("Failed to save glossary to localStorage", error);
    }
  };

  const addTerm = useCallback((newTerm: GlossaryTerm) => {
    setGlossary(prev => {
      // Avoid duplicates
      if (prev.some(t => t.term.toLowerCase() === newTerm.term.toLowerCase())) {
        return prev;
      }
      const updatedGlossary = [...prev, newTerm].sort((a, b) => a.term.localeCompare(b.term));
      saveGlossary(updatedGlossary);
      return updatedGlossary;
    });
  }, []);

  const removeTerm = useCallback((termToRemove: string) => {
    setGlossary(prev => {
      const updatedGlossary = prev.filter(t => t.term.toLowerCase() !== termToRemove.toLowerCase());
      saveGlossary(updatedGlossary);
      return updatedGlossary;
    });
  }, []);

  const isTermInGlossary = useCallback((term: string): boolean => {
    return glossary.some(t => t.term.toLowerCase() === term.toLowerCase());
  }, [glossary]);

  return { glossary, addTerm, removeTerm, isTermInGlossary };
};
