const RECIPES = [
  {
    recipeName: "Tomato Pasta",
    ingredients: ["tomatoes", "pasta", "garlic", "olive oil", "basil"],
    imageUrl: "https://source.unsplash.com/800x600/?tomato-pasta,spaghetti",
    steps: [
      "Boil a pot of salted water and cook the pasta until al dente.",
      "While the pasta cooks, heat olive oil in a pan over medium heat.",
      "Add minced garlic and cook until fragrant, then add chopped tomatoes.",
      "Simmer until the tomatoes break down into a sauce; season with salt and pepper.",
      "Toss the drained pasta with the tomato sauce and fresh basil.",
      "Serve hot, optionally topped with grated cheese."
    ]
  },
  {
    recipeName: "Chicken Stir Fry",
    ingredients: ["chicken", "broccoli", "soy sauce", "garlic", "onions"],
    imageUrl: "https://source.unsplash.com/800x600/?chicken-stir-fry,asian-food",
    steps: [
      "Slice the chicken into thin strips and season lightly with salt and pepper.",
      "Heat oil in a large pan or wok over high heat.",
      "Add chicken and cook until browned and mostly cooked through; remove and set aside.",
      "In the same pan, sauté sliced onions and minced garlic until fragrant.",
      "Add broccoli florets and stir-fry until crisp-tender.",
      "Return the chicken to the pan, pour in soy sauce, and toss until everything is coated and heated through."
    ]
  },
  {
    recipeName: "Avocado Toast",
    ingredients: ["avocado", "bread", "salt", "pepper", "olive oil"],
    imageUrl: "https://source.unsplash.com/800x600/?avocado-toast,breakfast",
    steps: [
      "Toast the bread slices until golden and crisp.",
      "Halve the avocado, remove the pit, and scoop the flesh into a bowl.",
      "Mash the avocado with a fork and season with salt, pepper, and a drizzle of olive oil.",
      "Spread the mashed avocado evenly over the toasted bread.",
      "Top with extra seasoning or toppings if desired and serve immediately."
    ]
  },
  {
    recipeName: "Beef Tacos",
    ingredients: ["ground beef", "tortillas", "lettuce", "cheese", "tomatoes"],
    imageUrl: "https://source.unsplash.com/800x600/?tacos,mexican-food",
    steps: [
      "Cook the ground beef in a pan over medium heat, breaking it up with a spoon.",
      "Season the beef with salt, pepper, and any taco seasoning if using.",
      "Warm the tortillas in a dry pan or microwave until soft and pliable.",
      "Chop the lettuce and tomatoes; grate the cheese if needed.",
      "Assemble tacos by filling tortillas with beef, lettuce, tomatoes, and cheese.",
      "Serve immediately with any extra toppings or sauces."
    ]
  },
  {
    recipeName: "Veggie Omelette",
    ingredients: ["eggs", "spinach", "mushrooms", "onions", "cheese"],
    imageUrl: "https://source.unsplash.com/800x600/?omelette,eggs",
    steps: [
      "Crack the eggs into a bowl, season with salt and pepper, and whisk until smooth.",
      "Slice mushrooms and onions; roughly chop the spinach.",
      "Sauté onions and mushrooms in a pan with a bit of oil until softened.",
      "Add spinach and cook until just wilted, then remove veggies from the pan.",
      "Pour the beaten eggs into the pan and cook over low heat until mostly set.",
      "Add the veggies and cheese to one half of the omelette, fold it over, and cook until the cheese melts."
    ]
  },
  {
    recipeName: "Salmon Bowl",
    ingredients: ["salmon", "rice", "avocado", "cucumber", "soy sauce"],
    imageUrl: "https://source.unsplash.com/800x600/?salmon-bowl,poke",
    steps: [
      "Cook rice according to package instructions and let it cool slightly.",
      "Season the salmon with salt and pepper, then bake or pan-sear until cooked through.",
      "Slice the avocado and cucumber into bite-sized pieces.",
      "Add rice to a bowl as the base.",
      "Top with flaked salmon, avocado, and cucumber.",
      "Drizzle with soy sauce (and any extra sauces you like) before serving."
    ]
  },
  {
    recipeName: "Shrimp Fried Rice",
    ingredients: ["shrimp", "rice", "peas", "carrots", "soy sauce"],
    imageUrl: "https://source.unsplash.com/800x600/?fried-rice,shrimp",
    steps: [
      "Cook rice ahead of time and let it cool (day-old rice works best).",
      "Season and sauté shrimp in a hot pan until pink and cooked through; remove and set aside.",
      "In the same pan, add a bit of oil and cook diced carrots and peas until tender.",
      "Add the rice to the pan and stir-fry, breaking up any clumps.",
      "Return the shrimp to the pan and pour in soy sauce, tossing to coat evenly.",
      "Cook for a few more minutes until everything is heated through."
    ]
  },
  {
    recipeName: "Greek Salad",
    ingredients: ["tomatoes", "cucumber", "feta", "olives", "onions"],
    imageUrl: "https://source.unsplash.com/800x600/?greek-salad,mediterranean",
    steps: [
      "Chop tomatoes and cucumber into bite-sized pieces.",
      "Thinly slice the onions.",
      "Combine tomatoes, cucumber, onions, and olives in a large bowl.",
      "Crumble feta cheese over the top.",
      "Drizzle with olive oil, season with salt and pepper, and toss gently before serving."
    ]
  },
  {
    recipeName: "Burger",
    ingredients: ["ground beef", "bun", "lettuce", "tomatoes", "cheese"],
    imageUrl: "https://source.unsplash.com/800x600/?burger,cheeseburger",
    steps: [
      "Form the ground beef into burger patties and season with salt and pepper.",
      "Cook the patties in a pan or on a grill until desired doneness.",
      "Place cheese slices on the patties during the last minute of cooking to melt.",
      "Toast the buns lightly if desired.",
      "Assemble the burger with lettuce, tomato slices, and the cooked patty on the bun.",
      "Serve immediately with any additional toppings or sauces."
    ]
  },
  {
    recipeName: "Chicken Caesar Salad",
    ingredients: ["chicken", "romaine", "croutons", "parmesan", "caesar dressing"],
    imageUrl: "https://source.unsplash.com/800x600/?caesar-salad,chicken-salad",
    steps: [
      "Season the chicken and cook it in a pan or on a grill until fully cooked; let it rest, then slice.",
      "Chop the romaine lettuce into bite-sized pieces and place in a large bowl.",
      "Add croutons and grated or shaved parmesan cheese.",
      "Top with the sliced chicken.",
      "Drizzle Caesar dressing over the salad and toss gently to combine before serving."
    ]
  }
]
export { RECIPES }