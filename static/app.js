const DECKS = [
  { id: 1, name: 'Deck 1 (N4)', path: 'assets/kanji.csv' },
  { id: 2, name: 'Deck 2 (Kanji 5-10)', path: 'assets/kanji6to10.csv' }
];

const el = id => document.getElementById(id);
const cardEl = el('card');
const innerEl = el('card-inner');
const frontEl = el('card-front');
const backEl = el('card-back');
const statusEl = el('status');

const prevBtn = el('prev');
const nextBtn = el('next');
const flipBtn = el('flip');
const shuffleBtn = el('shuffle');

let cards = [];
let index = 0;
let currentDeckId = 1;
let decksData = {};

function parseCSV(text){
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(l=>l);
  const out = lines.map(line => {
    // naive CSV split on commas, safe for this dataset
    const cols = line.split(',').map(c=>c.trim().replace(/^"|"$/g,''));
    const front = cols[0] || '';
    // column 2: reading / kana; column 3: meaning (English)
    const reading = cols[1] || '';
    const meaning = cols[2] || '';
    return {front, reading, meaning};
  });
  return out;
}

function showStatus(){
  statusEl.textContent = cards.length ? `${index+1} / ${cards.length}` : 'No cards loaded';
}

function showCard(i){
  if(!cards.length) return;
  index = ((i % cards.length) + cards.length) % cards.length;
  const c = cards[index];
  frontEl.textContent = c.front || '—';
  // populate reading and meaning on the back
  const readingEl = document.getElementById('card-reading');
  const meaningEl = document.getElementById('card-meaning');
  readingEl.textContent = c.reading || '';
  meaningEl.textContent = c.meaning || '';
  cardEl.classList.remove('flipped');
  showStatus();
}

function flipCard(){
  cardEl.classList.toggle('flipped');
}

function nextCard(){ showCard(index+1); }
function prevCard(){ showCard(index-1); }

function shuffle(){
  for(let i=cards.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [cards[i],cards[j]] = [cards[j],cards[i]];
  }
  showCard(0);
}

flipBtn.addEventListener('click', flipCard);
nextBtn.addEventListener('click', nextCard);
prevBtn.addEventListener('click', prevCard);
shuffleBtn.addEventListener('click', shuffle);

// Deck selector event listeners
document.getElementById('deck-1').addEventListener('click', () => switchDeck(1));
document.getElementById('deck-2').addEventListener('click', () => switchDeck(2));

function switchDeck(deckId) {
  currentDeckId = deckId;
  
  // Update button styles
  document.querySelectorAll('.deck-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById('deck-' + deckId).classList.add('active');
  
  // Switch to the deck data
  cards = decksData[deckId] || [];
  index = 0;
  
  if (cards.length > 0) {
    showCard(0);
  } else {
    statusEl.textContent = 'Deck loading...';
  }
}

cardEl.addEventListener('click', flipCard);
document.addEventListener('keydown', (e)=>{
  if(e.code === 'ArrowRight') nextCard();
  if(e.code === 'ArrowLeft') prevCard();
  if(e.code === 'Space') { e.preventDefault(); flipCard(); }
});

fetch(DECKS[0].path).then(r=>{
  if(!r.ok) throw new Error('Failed to load CSV: '+r.status);
  return r.text();
}).then(text=>{
  decksData[1] = parseCSV(text);
  if(decksData[1].length===0) statusEl.textContent = 'No cards found in Deck 1';
  
  // Load second deck
  return fetch(DECKS[1].path).then(r=>{
    if(!r.ok) throw new Error('Failed to load second CSV: '+r.status);
    return r.text();
  }).then(text=>{
    decksData[2] = parseCSV(text);
    
    // Initialize with first deck
    cards = decksData[1];
    if(cards.length===0) statusEl.textContent = 'No cards found in any deck';
    showCard(0);
  });
}).catch(err=>{
  statusEl.textContent = 'Error loading cards. See console.';
  console.error(err);
});
