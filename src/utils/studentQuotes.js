/**
 * studentQuotes.js
 * Curated motivational quotes for university students and scientists,
 * paired with an async fetcher from free public APIs.
 */

export const CURATED_STUDENT_QUOTES = [
  {
    quote: "I would rather have questions that can't be answered than answers that can't be questioned.",
    author: "Richard Feynman",
    field: "Theoretical Physics & Quantum Electrodynamics"
  },
  {
    quote: "An equation for me has no meaning unless it expresses a thought of pure truth.",
    author: "Srinivasa Ramanujan",
    field: "Mathematics & Number Theory"
  },
  {
    quote: "Nothing in life is to be feared, it is only to be understood. Now is the time to understand more, so that we may fear less.",
    author: "Marie Curie",
    field: "Physics & Chemistry, 2x Nobel Laureate"
  },
  {
    quote: "Sometimes it is the people no one can imagine anything of who do the things no one can imagine.",
    author: "Alan Turing",
    field: "Computer Science & Cryptanalysis"
  },
  {
    quote: "You cannot change your future, but you can change your habits, and surely your habits will change your future.",
    author: "Dr. A.P.J. Abdul Kalam",
    field: "Aerospace Engineering & Former President of India"
  },
  {
    quote: "Education is not the learning of facts, but the training of the mind to think.",
    author: "Albert Einstein",
    field: "Theoretical Physics"
  },
  {
    quote: "The present is theirs; the future, for which I really worked, is mine.",
    author: "Nikola Tesla",
    field: "Electrical & Mechanical Engineering"
  },
  {
    quote: "Learning never exhausts the mind.",
    author: "Leonardo da Vinci",
    field: "Polymath & Engineering"
  },
  {
    quote: "Arise, awake, and stop not until the goal is reached.",
    author: "Swami Vivekananda",
    field: "Philosophy & Education"
  },
  {
    quote: "If I have seen further, it is by standing on the shoulders of giants.",
    author: "Sir Isaac Newton",
    field: "Classical Mechanics & Calculus"
  },
  {
    quote: "Somewhere, something incredible is waiting to be known.",
    author: "Carl Sagan",
    field: "Astronomy & Astrophysics"
  },
  {
    quote: "That brain of mine is something more than merely mortal; as time will show.",
    author: "Ada Lovelace",
    field: "Pioneer of Computer Programming"
  },
  {
    quote: "Genius is one percent inspiration, ninety-nine percent perspiration.",
    author: "Thomas Edison",
    field: "Applied Science & Invention"
  },
  {
    quote: "Look up at the stars and not down at your feet. Try to make sense of what you see.",
    author: "Stephen Hawking",
    field: "Cosmology & Quantum Gravity"
  },
  {
    quote: "I hear and I forget. I see and I remember. I do and I understand.",
    author: "Confucius",
    field: "Philosophy of Learning"
  },
  {
    quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle",
    field: "Classical Philosophy & Natural Science"
  },
  {
    quote: "The only way to do great work is to love what you do. Stay hungry, stay foolish.",
    author: "Steve Jobs",
    field: "Technology & Design"
  },
  {
    quote: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi",
    field: "Philosophy & Leadership"
  },
  {
    quote: "Like what you do, and then you will do your best.",
    author: "Katherine Johnson",
    field: "Orbital Mechanics & NASA Mathematician"
  },
  {
    quote: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius",
    field: "Philosophy of Persistence"
  }
];

export function getRandomCuratedQuote() {
  const idx = Math.floor(Math.random() * CURATED_STUDENT_QUOTES.length);
  return CURATED_STUDENT_QUOTES[idx];
}

/**
 * Fetch a fresh random motivational quote from a free public API with instant timeout fallback.
 */
export async function fetchRandomStudentQuote() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch('https://dummyjson.com/quotes/random', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.quote && data.author) {
        return {
          quote: data.quote,
          author: data.author,
          field: 'Campus Thought & Focus'
        };
      }
    }
  } catch (err) {
    // Graceful fallback to curated offline quotes
  }

  return getRandomCuratedQuote();
}
