import { TopicConfig } from '../types';

/**
 * Modular Sub-Website Topic Registry
 * To add a new sub-website topic to Favourity, simply append an entry to TOPICS_REGISTRY.
 */
export const TOPICS_REGISTRY: TopicConfig[] = [
  {
    id: 'food',
    name: 'Favourity Food',
    tagline: 'Order your palate. Discover your definitive gastronomy hierarchy.',
    iconName: 'Utensils',
    badge: 'Culinary Obsessions',
    accentGradient: 'from-amber-500 via-orange-500 to-rose-500',
    description: 'Rank artisanal dishes, comfort meals, and world delicacies without debate.',
    items: [
      { id: 'food_pizza', name: 'Artisan Neapolitan Pizza', description: 'Wood-fired sourdough with San Marzano tomatoes and fior di latte', category: 'Italian' },
      { id: 'food_sushi', name: 'Fresh Nigiri Sushi', description: 'Otoro fatty tuna & fresh salmon over seasoned warm sushi rice', category: 'Japanese' },
      { id: 'food_tacos', name: 'Street Birria Tacos', description: 'Slow-cooked braised beef in crispy corn tortillas with rich consommé', category: 'Mexican' },
      { id: 'food_burger', name: 'Double Smash Cheeseburger', description: 'Lacy crisped edges, melty American cheese, pickles & secret sauce', category: 'American' },
      { id: 'food_ramen', name: 'Rich Tonkotsu Ramen', description: '18-hour simmered pork bone broth with springy noodles & chashu', category: 'Japanese' },
      { id: 'food_pasta', name: 'Handmade Cacio e Pepe', description: 'Fresh tagliolini tossed in emulsified Pecorino Romano & toasted pepper', category: 'Italian' },
      { id: 'food_croissant', name: 'French Butter Croissant', description: 'Laminated golden layers with cultured Normandy butter', category: 'Bakery' },
      { id: 'food_thai_curry', name: 'Authentic Thai Green Curry', description: 'Fragrant coconut cream, Thai basil, bird’s eye chili and bamboo shoots', category: 'Thai' },
      { id: 'food_bbq_ribs', name: 'Smoked Texas Beef Ribs', description: 'Post oak smoked for 12 hours with deep mahogany pepper bark', category: 'BBQ' },
      { id: 'food_gelato', name: 'Pistachio Bronte Gelato', description: 'Silky slow-churned Sicilian pistachio with roasted nut crunch', category: 'Dessert' }
    ]
  },
  {
    id: 'movies',
    name: 'Favourity Movies',
    tagline: 'No review bombs. Pure unadulterated cinematic ranking.',
    iconName: 'Film',
    badge: 'Cinematics',
    accentGradient: 'from-purple-500 via-indigo-500 to-blue-500',
    description: 'Settle your all-time cinema canon through pairwise clarity.',
    items: [
      { id: 'movie_interstellar', name: 'Interstellar (2014)', description: 'Christopher Nolan’s epic journey across gargantua and human love', category: 'Sci-Fi' },
      { id: 'movie_inception', name: 'Inception (2010)', description: 'Mind-bending dream-within-a-dream heist thriller', category: 'Thriller' },
      { id: 'movie_dark_knight', name: 'The Dark Knight (2008)', description: 'Heath Ledger and Christian Bale in Gotham’s psychological battle', category: 'Action' },
      { id: 'movie_matrix', name: 'The Matrix (1999)', description: 'The Wachowskis’ groundbreaking cyberpunk revolution', category: 'Sci-Fi' },
      { id: 'movie_spirited_away', name: 'Spirited Away (2001)', description: 'Hayao Miyazaki & Studio Ghibli’s timeless animated masterpiece', category: 'Animation' },
      { id: 'movie_godfather', name: 'The Godfather (1972)', description: 'Francis Ford Coppola’s monumental Corleone family chronicle', category: 'Crime / Drama' },
      { id: 'movie_pulp_fiction', name: 'Pulp Fiction (1994)', description: 'Quentin Tarantino’s nonlinear neo-noir pop culture milestone', category: 'Crime' },
      { id: 'movie_parasite', name: 'Parasite (2019)', description: 'Bong Joon-ho’s razor-sharp social satire and thriller', category: 'Drama' },
      { id: 'movie_blade_runner_2049', name: 'Blade Runner 2049 (2017)', description: 'Denis Villeneuve’s atmospheric neo-noir visual spectacle', category: 'Sci-Fi' },
      { id: 'movie_whiplash', name: 'Whiplash (2014)', description: 'Damien Chazelle’s relentless pursuit of perfection and rhythm', category: 'Drama' }
    ]
  },
  {
    id: 'video-games',
    name: 'Favourity Video Games',
    tagline: 'Your sacred hall of interactive masterpieces.',
    iconName: 'Gamepad2',
    badge: 'Gaming Canon',
    accentGradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    description: 'Pinpoint which virtual worlds captured your soul the deepest.',
    items: [
      { id: 'game_zelda_botw', name: 'The Legend of Zelda: Breath of the Wild', description: 'Reinvented open-world emergent physics and boundless exploration', category: 'Action-Adventure' },
      { id: 'game_elden_ring', name: 'Elden Ring', description: 'FromSoftware’s grand Lands Between dark fantasy triumph', category: 'Action RPG' },
      { id: 'game_witcher3', name: 'The Witcher 3: Wild Hunt', description: 'Geralt of Rivia’s morally grey masterclass in narrative RPG design', category: 'RPG' },
      { id: 'game_portal2', name: 'Portal 2', description: 'Valve’s pinnacle of physics puzzle design and biting comedic writing', category: 'Puzzle' },
      { id: 'game_red_dead_2', name: 'Red Dead Redemption 2', description: 'Rockstar’s obsessive simulation of Arthur Morgan in the vanishing frontier', category: 'Open World' },
      { id: 'game_hollow_knight', name: 'Hollow Knight', description: 'Team Cherry’s melancholic, intricate Hallownest metroidvania', category: 'Metroidvania' },
      { id: 'game_baldurs_gate_3', name: 'Baldur’s Gate 3', description: 'Larian Studios’ revolutionary D&D reactive roleplaying epic', category: 'CRPG' },
      { id: 'game_half_life_2', name: 'Half-Life 2', description: 'The timeless narrative shooter that defined physical environmental storytelling', category: 'FPS' }
    ]
  },
  {
    id: 'tech',
    name: 'Favourity Tech & Gear',
    tagline: 'Your holy grail hardware and daily drivers ranked.',
    iconName: 'Cpu',
    badge: 'Hardware & EDC',
    accentGradient: 'from-sky-500 via-blue-600 to-indigo-600',
    description: 'The definitive tools, displays, and gadgets that power your craft.',
    items: [
      { id: 'tech_macbook', name: 'Apple Silicon MacBook Pro', description: 'Unmatched performance per watt and all-day silent battery life', category: 'Laptop' },
      { id: 'tech_mechanical_kb', name: 'Custom Mechanical Keyboard', description: 'Gasket-mounted lubed linear switches with aluminium chassis', category: 'Peripherals' },
      { id: 'tech_oled_monitor', name: '4K OLED Ultra-wide Display', description: 'Infinite contrast ratio, true blacks and buttery refresh rate', category: 'Display' },
      { id: 'tech_anc_headphones', name: 'Flagship ANC Headphones', description: 'Studio acoustics with active acoustic isolation for deep focus', category: 'Audio' },
      { id: 'tech_ergonomic_mouse', name: 'Ergonomic Vertical Mouse', description: 'Neutral wrist posture with hyper-scroll precision wheel', category: 'Peripherals' },
      { id: 'tech_kindle_paperwhite', name: 'Kindle Paperwhite E-Reader', description: 'Glare-free 300 ppi warm light distraction-free reading', category: 'E-Reader' }
    ]
  }
];

export function getTopicById(topicId: string): TopicConfig | undefined {
  return TOPICS_REGISTRY.find(t => t.id === topicId);
}

export function getDefaultTopic(): TopicConfig {
  return TOPICS_REGISTRY[0];
}
