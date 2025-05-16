import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function TestDataGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generateTestLead = async () => {
    setIsGenerating(true);
    try {
      const randomNumber = Math.floor(Math.random() * 10000);
      const newLead = {
        name: `Test Lead ${randomNumber}`,
        twitter_handle: `testuser${randomNumber}`,
        profile_image_url: "https://abs.twimg.com/sticky/default_profile_images/default_profile.png",
        follower_count: Math.floor(Math.random() * 5000),
        last_post_date: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('leads')
        .insert([newLead])
        .select();
      
      if (error) throw error;
      
      console.log('Generated test lead:', data);
      toast.success('Test lead generated!');
    } catch (error) {
      console.error('Error generating test lead:', error);
      toast.error('Failed to generate test lead');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <button
      onClick={generateTestLead}
      disabled={isGenerating}
      className="px-4 py-2 bg-[#252525] text-white rounded-lg hover:bg-[#1a1a1a] disabled:opacity-50"
    >
      {isGenerating ? 'Generating...' : 'Generate Test Lead'}
    </button>
  );
} 