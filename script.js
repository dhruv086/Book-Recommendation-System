const moodKeywords = {
  happy: ['happy', 'joyful', 'excited', 'cheerful', 'glad', 'delighted'],
  sad: ['sad', 'depressed', 'down', 'unhappy', 'blue', 'miserable'],
  stressed: ['stressed', 'anxious', 'worried', 'nervous', 'overwhelmed', 'tense'],
  excited: ['excited', 'thrilled', 'energetic', 'enthusiastic', 'pumped', 'stoked']
};

// Mood to subject mapping for OpenLibrary API
const moodToSubject = {
  happy: ['humor', 'comedy', 'inspiration'],
  sad: ['self-help', 'motivation', 'inspiration'],
  stressed: ['meditation', 'mindfulness', 'relaxation'],
  excited: ['adventure', 'thriller', 'action']
};

// Add message to chat
function addMessage(message, isUser = false) {
  const chatMessages = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
  messageDiv.textContent = message;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Detect mood from user input
function detectMood(input) {
  input = input.toLowerCase();
  for (const [mood, keywords] of Object.entries(moodKeywords)) {
      if (keywords.some(keyword => input.includes(keyword))) {
          return mood;
      }
  }
  return 'happy'; // default mood
}

// Get book recommendations from OpenLibrary API
async function getBookRecommendations(mood, genre, count) {
  try {
      const subjects = moodToSubject[mood] || moodToSubject.happy;
      const searchSubject = genre ? genre : subjects[Math.floor(Math.random() * subjects.length)];
      
      // Search for books by subject with increased limit
      const response = await fetch(`https://openlibrary.org/subjects/${searchSubject}.json?limit=${count * 2}`);
      const data = await response.json();
      
      if (!data.works || data.works.length === 0) {
          return "I apologize, but I couldn't find any books matching your preferences. Please try a different mood or genre.";
      }

      // Get detailed information for requested number of random books
      const selectedBooks = data.works
          .sort(() => 0.5 - Math.random())
          .slice(0, count);

      let recommendations = `Based on your mood and preferences, here are ${count} book recommendations:\n\n`;
      
      for (const book of selectedBooks) {
          const bookKey = book.key;
          const bookResponse = await fetch(`https://openlibrary.org${bookKey}.json`);
          const bookData = await bookResponse.json();
          
          recommendations += `📖 "${bookData.title}" by ${bookData.authors ? bookData.authors[0].name : 'Unknown Author'}\n\n`;
          recommendations += `Description: ${bookData.description ? 
              (typeof bookData.description === 'string' ? bookData.description : bookData.description.value) : 
              'No description available'}\n\n`;
          recommendations += `Why this book: This book matches your mood because it's related to ${searchSubject}.\n\n`;
          recommendations += `----------------------------------------\n\n\n`;
          // document.write("<br><br>");
      }

      return recommendations;
  } catch (error) {
      console.error('Error:', error);
      return "I apologize, but I'm having trouble connecting to the book recommendation service right now. Please try again later.";
  }
}

// Handle sending messages
async function sendMessage() {
  const input = document.getElementById('user-input');
  const genreSelect = document.getElementById('genre-select');
  const countInput = document.getElementById('recommendation-count');
  const message = input.value.trim();
  const genre = genreSelect.value;
  const count = parseInt(countInput.value) || 3; // Default to 3 if invalid
  
  if (message === '') return;

  // Add user message to chat
  addMessage(message, true);
  input.value = '';
  genreSelect.value = '';
  countInput.value = '3'; // Reset to default

  // Show typing indicator
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot';
  typingDiv.textContent = 'Finding the perfect books for you...';
  document.getElementById('chat-messages').appendChild(typingDiv);

  // Get and display recommendation
  const recommendation = await getBookRecommendations(message, genre, count);
  document.getElementById('chat-messages').removeChild(typingDiv);
  addMessage(recommendation);
}

// Handle Enter key press
document.getElementById('user-input').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
      sendMessage();
  }
});