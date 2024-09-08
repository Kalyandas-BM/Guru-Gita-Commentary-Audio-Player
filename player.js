const audioElement = document.getElementById('audio');
const audioSource = document.getElementById('audioSource');
const thumbnailElement = document.getElementById('thumbnail');
const titleElement = document.getElementById('verseTitle');
const subtitleElement = document.getElementById('verseSubtitle');
const verseListElement = document.getElementById('verseList');
const playPauseButton = document.querySelector('#playPause i');
const nextButton = document.getElementById('next');
const prevButton = document.getElementById('prev');
const shuffleButton = document.getElementById('shuffle');
const volumeButton = document.getElementById('volumeButton');
const volumeControl = document.getElementById('volumeControl');
const progressBar = document.getElementById('progressBar');
const currentTimeElement = document.getElementById('currentTime');
const durationElement = document.getElementById('duration');
const rewindButton = document.getElementById('rewind');
const forwardButton = document.getElementById('forward');

let verseData = []; // Declare as a global array to hold verse data
let currentVerseIndex = 0;
let isPlaying = false;
let isVolumeVisible = false;

// let userEmail = 'user@example.com'; // Set this dynamically for each user

// Function to generate a random string for cache-busting
function generateRandomString() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Fetch verse data from the server
fetch(`https://bhaktimarga.org/up/playertest/verses.php?cachebuster=${generateRandomString()}`)
  .then(response => response.json())
  .then(data => {
    verseData = data; // Assign data to the global verseData array
    fetchLastProgress(); // Fetch the last saved progress
    populateVerseList(); // Populate the list of verses
  })
  .catch(error => console.error('Error loading verse data:', error));

// Fetch the user's last saved progress
function fetchLastProgress() {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", `https://phpstack-1107017-3957074.cloudwaysapps.com/get_progress.php?cachebuster=${generateRandomString()}`, true);
  xhr.setRequestHeader("Content-Type", "application/json");

  const data = {
    email: userEmail  // Send the user's email to fetch their saved progress
  };

  xhr.send(JSON.stringify(data));

  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const response = JSON.parse(xhr.responseText);
      console.log('Fetched progress:', response);

      if (response && response.verse_number && response.timecode !== undefined) {
        const verseIndex = verseData.findIndex(verse => verse["Verse Number"] == response.verse_number);
        if (verseIndex !== -1) {
          loadVerse(verseIndex);
          audioElement.currentTime = parseFloat(response.timecode);
        }
      } else {
        console.log('No saved progress, starting from the first verse.');
        loadVerse(0); // Default to the first verse if no progress is found
      }
    } else if (xhr.readyState === 4) {
      console.error('Failed to fetch saved progress.');
    }
  };
}

function populateVerseList() {
  verseData.forEach((verse, index) => {
    const li = document.createElement('li');
    li.textContent = `Verse ${verse["Verse Number"]}: ${verse["Title"]}`;
    li.addEventListener('click', () => {
      loadVerse(index);
    });
    verseListElement.appendChild(li);
  });
}

// Load a verse into the player
function loadVerse(index) {
  if (verseData.length === 0) return; // Ensure verseData is available

  const verse = verseData[index];
  audioSource.src = verse.URL;
  thumbnailElement.src = verse.Thumbnail;
  titleElement.textContent = verse.Title;
  subtitleElement.textContent = verse.Subtitle;
  currentVerseIndex = index;
  audioElement.load(); // Reload audio element with the new source
}

// Toggle play/pause
function togglePlayPause() {
  if (audioElement.paused) {
    audioElement.play().catch((error) => {
      console.error("Playback error:", error);
    });
    playPauseButton.classList = 'fa-solid fa-circle-pause';
  } else {
    audioElement.pause();
    playPauseButton.classList = 'fa-solid fa-circle-play';
  }
}

playPauseButton.addEventListener('click', togglePlayPause);// For mobile devices

// Ensure duration is updated once the metadata is loaded
audioElement.addEventListener('loadedmetadata', () => {
  const duration = audioElement.duration;
  if (!isNaN(duration)) {
    durationElement.textContent = formatTime(duration);
  }
});

// Update progress bar as the audio plays
audioElement.addEventListener('timeupdate', updateProgress);

function updateProgress() {
  const { currentTime, duration } = audioElement;
  progressBar.max = duration || 0;
  progressBar.value = currentTime;
  currentTimeElement.textContent = formatTime(currentTime);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

progressBar.addEventListener('input', (e) => {
  const seekTime = e.target.value;
  audioElement.currentTime = seekTime;
});

nextButton.addEventListener('click', () => {
  currentVerseIndex = (currentVerseIndex + 1) % verseData.length;
  loadVerse(currentVerseIndex);
});
prevButton.addEventListener('click', () => {
  currentVerseIndex = (currentVerseIndex - 1 + verseData.length) % verseData.length;
  loadVerse(currentVerseIndex);
});
shuffleButton.addEventListener('click', () => {
  currentVerseIndex = Math.floor(Math.random() * verseData.length);
  loadVerse(currentVerseIndex);
  playPauseButton.classList = 'fa-solid fa-circle-play';
});

volumeControl.addEventListener('input', (e) => {
  audioElement.volume = e.target.value;
});

// Event listener to rewind 20 seconds
rewindButton.addEventListener('click', () => {
  audioElement.currentTime = Math.max(0, audioElement.currentTime - 20);
});

// Event listener to fast forward 20 seconds
forwardButton.addEventListener('click', () => {
  audioElement.currentTime = Math.min(audioElement.duration, audioElement.currentTime + 20);
});

// Automatically load the next verse when the current one ends
audioElement.addEventListener('ended', () => {
  currentVerseIndex = (currentVerseIndex + 1) % verseData.length;
  loadVerse(currentVerseIndex);
  playPauseButton.classList = 'fa-solid fa-circle-play';
});
