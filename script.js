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
function addMessage(message, isUser = false, showButtons = false) {
  const chatMessages = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
  
  if (showButtons) {
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = message;
    messageDiv.appendChild(messageContent);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    
    const yesButton = document.createElement('button');
    yesButton.className = 'response-button yes-button';
    yesButton.textContent = 'Yes, please!';
    yesButton.onclick = () => {
      addMessage('Yes, I would like more recommendations!', true);
      setTimeout(() => {
        addMessage("Perfect! Just tell me your mood, pick a genre, and how many books you'd like. I'm ready when you are! 😊", false);
        document.getElementById('user-input').focus();
      }, 1000);
    };
    
    const noButton = document.createElement('button');
    noButton.className = 'response-button no-button';
    noButton.textContent = 'No, thanks!';
    noButton.onclick = () => {
      addMessage('No, thank you!', true);
      addMessage('Thank you for using our AI Book Recommender! Feel free to come back anytime for more recommendations. Happy reading! 📚✨', false);
    };
    
    buttonContainer.appendChild(yesButton);
    buttonContainer.appendChild(noButton);
    messageDiv.appendChild(buttonContainer);
  } else {
    messageDiv.textContent = message;
  }
  
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
      const searchSubject = genre || subjects[Math.floor(Math.random() * subjects.length)];
      
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
      
      for (let i = 0; i < selectedBooks.length; i++) {
          const book = selectedBooks[i];
          const bookKey = book.key;
          const bookResponse = await fetch(`https://openlibrary.org${bookKey}.json`);
          const bookData = await bookResponse.json();
          
          recommendations += `📚 Book #${i + 1}:\n`;
          recommendations += `📖 "${bookData.title}" by ${bookData.authors ? bookData.authors[0].name : 'Unknown Author'}\n\n`;
          recommendations += `Description: ${bookData.description ? 
              (typeof bookData.description === 'string' ? bookData.description : bookData.description.value) : 
              'No description available'}\n\n`;
          recommendations += `Why this book: This book matches your mood because it's related to ${searchSubject}.\n\n`;
          recommendations += `----------------------------------------\n\n\n`;
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
  const count = parseInt(countInput.value) || 3;
  
  if (message === '') return;

  // Add user message to chat
  addMessage(message, true);
  input.value = '';
  genreSelect.value = '';
  countInput.value = '3';

  // Show typing indicator
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot';
  typingDiv.textContent = 'Finding the perfect books for you...';
  document.getElementById('chat-messages').appendChild(typingDiv);

  // Get mood and recommendations
  const mood = detectMood(message);
  const recommendations = await getBookRecommendations(mood, genre, count);

  // Remove typing indicator
  typingDiv.remove();

  // Add recommendations to chat
  addMessage(recommendations);

  // Add follow-up message with buttons after a short delay
  setTimeout(() => {
    const followUpMessage = "I hope you find these recommendations helpful! Would you like more book suggestions?";
    addMessage(followUpMessage, false, true);
  }, 1000);
}

// Handle Enter key press
document.getElementById('user-input').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
      sendMessage();
  }
});