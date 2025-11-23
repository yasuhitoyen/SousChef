export default function useApi() {
  const fetchRecipes = async () => {
	// fetch 
    const res = await fetch("/api/ingredients");
    return res.json();
  };

  const fetchAudio = async (ingredients) => {
	// fetch request to backend
    const res = await fetch(`/api/recipes?ingredients=${ingredients}`);
    return res.json();
  };

  return {
    fetchRecipes,
    fetchAudio,
  };
}