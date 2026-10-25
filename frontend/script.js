/* =====================================================
   OFFSCRIPT - script.js (beginner-friendly version)
   Sections:
   1. Settings and product data
   2. Variables and page elements
   3. Helper functions
   4. Search, filter and sort
   5. Showing products (cards, filters)
   6. Quick-view dialog
   7. Shopping bag (cart)
   8. Wishlist
   9. Newsletter form
   10. Choose Your Timeline
   11. Drawers, menu and toast
   12. Scroll effects, ticker, cursor
   13. Click handling and start-up
   ===================================================== */


/* ---------- 1. SETTINGS AND PRODUCT DATA ---------- */


const PRODUCTS_URL = 'data/products.json';

// Brand colors (same as the CSS variables)
const SILVER = '#C7CCD4';
const PINK = '#FF69B4';
const BLUE = '#5B7CFF';
const PURPLE = '#A855F7';
const PEARL = '#FAF8FF';
const NAVY = '#17152B';

// Color names -> color codes, used for the small color dots on cards
const COLORS = { Silver: SILVER, Pink: PINK, Blue: BLUE, Purple: PURPLE, Pearl: PEARL, Navy: NAVY };

const CATEGORIES = [
  { id: 'cyber-essentials', name: 'Cyber Essentials' },
  { id: 'baby-tees', name: 'Baby Tees' },
  { id: 'metallic-accessories', name: 'Metallic Accessories' },
  { id: 'denim-reloaded', name: 'Denim Reloaded' },
  { id: 'afterparty-fits', name: 'Afterparty Fits' },
  { id: 'future-classics', name: 'Future Classics' }
];

// Makes a simple colorful placeholder picture (an SVG drawing) because we have no real photos yet.
// FUTURE: replace the placeholder calls below with real image links like 'images/puffer.jpg'.
function makePlaceholder(number, label, sub) {
  const pairs = [[PINK, PURPLE], [BLUE, SILVER], [SILVER, PEARL], [PURPLE, NAVY], [PINK, BLUE], [PEARL, PINK]];
  const pair = pairs[number % 6];
  let textColor = NAVY;
  if (number % 6 === 3) {
    textColor = PEARL; // light text on the dark background
  }
  const ballX = 90 + (number * 67) % 220;
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">' +
    '<defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + pair[0] + '"/><stop offset="1" stop-color="' + pair[1] + '"/></linearGradient>' +
    '<radialGradient id="o" cx=".32" cy=".28" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="' + SILVER + '"/><stop offset=".65" stop-color="' + BLUE + '"/><stop offset="1" stop-color="' + NAVY + '"/></radialGradient></defs>' +
    '<rect width="400" height="500" fill="url(#b)"/>' +
    '<circle cx="' + ballX + '" cy="190" r="86" fill="url(#o)"/>' +
    '<polygon points="320,60 332,96 370,100 340,122 350,160 320,138 290,160 300,122 270,100 308,96" fill="' + PEARL + '" opacity=".9"/>' +
    '<text x="24" y="410" font-family="Impact,sans-serif" font-size="56" fill="' + textColor + '">' + label + '</text>' +
    '<text x="24" y="448" font-family="Arial,sans-serif" font-weight="700" font-size="13" letter-spacing="3" fill="' + textColor + '">' + sub + '</text>' +
    '</svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

// Timeline moods for the "Choose Your Timeline" section
const TIMELINES = [
  { id: 'chrome', name: 'Chrome Angel', desc: 'Liquid silver, glossy layers and a halo of reflections. Dressed for an airport lounge in 2003.', color1: SILVER, color2: BLUE, image: 'assets/img 4.png' },
  { id: 'popstar', name: 'Digital Popstar', desc: 'Pink flash, baby tees and statement bags. Main-character energy, music video lighting.', color1: PINK, color2: PURPLE, image: 'assets/img 6.png' },
  { id: 'romantic', name: 'Cyber Romantic', desc: 'Soft pearls, sheer layers and heart-shaped details. Sweet, but with a signal.', color1: PINK, color2: SILVER, image: 'assets/img 3.png' },
  { id: 'glitch', name: 'Midnight Glitch', desc: 'Baggy denim, dark chrome and static. Built for the afterparty and the next timeline.', color1: PURPLE, color2: NAVY, image: 'assets/img 5.png' }
];

// The product list. Each product is an object. This is demo data shaped like future database records.


// FUTURE (backend): this is the one place that would change. Instead of returning PRODUCTS,
// you would call fetch(API_BASE_URL + '/api/products') and return the result.
async function getProducts() {
  const response = await fetch(PRODUCTS_URL);
  if (!response.ok) {
    throw new Error('Could not load products: ' + response.status);
  }
  return await response.json();
}

/* ---------- 2. VARIABLES AND PAGE ELEMENTS ---------- */

let allProducts = [];          // all products
let selectedCategory = 'all';  // current category filter
let searchText = '';           // current search words
let sortBy = 'featured';       // current sort option
let activeTimeline = '';       // chosen timeline ('' means none chosen)

let chosenSize = null;         // size picked in quick view
let chosenColor = null;        // color picked in quick view
let lastFocusedButton = null;  // remembers which button opened a drawer
let toastTimer = null;

// The cart is a list of objects like { id: 'p1', size: 'M', color: 'Pink', qty: 2 }
// The wishlist is a list of product ids like ['p1', 'p4']. Both are loaded from localStorage.
let cart = loadList('offscript_y2k_cart');
let wishlist = loadList('offscript_y2k_wish');

// Does the visitor prefer less motion? (system setting)
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Page elements we use many times
const header = document.querySelector('#header');
const menu = document.querySelector('#menu');
const menuButton = document.querySelector('#btn-menu');
const grid = document.querySelector('#grid');
const gridState = document.querySelector('#grid-state');
const resultCount = document.querySelector('#result-count');
const filterBox = document.querySelector('#filters');
const searchInput = document.querySelector('#q');
const sortSelect = document.querySelector('#sort');
const overlay = document.querySelector('#overlay');
const cartDrawer = document.querySelector('#cart-drawer');
const wishDrawer = document.querySelector('#wish-drawer');
const productDialog = document.querySelector('#product-dlg');
const productBody = document.querySelector('#product-body');
const toast = document.querySelector('#toast');
const toTopButton = document.querySelector('#to-top');


/* ---------- 3. HELPER FUNCTIONS ---------- */

// Turns 3499 into "₹3,499"
function formatPrice(number) {
  return '₹' + number.toLocaleString('en-IN');
}

// Looks through all products and returns the one with this id
function findProduct(id) {
  for (let i = 0; i < allProducts.length; i++) {
    if (allProducts[i].id === id) {
      return allProducts[i];
    }
  }
  return null;
}

function getCategoryName(id) {
  for (let i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].id === id) {
      return CATEGORIES[i].name;
    }
  }
  return id;
}

// Text shown under each product: Sold out / Only 3 left / In stock
function getStockText(product) {
  if (product.stock === 0) {
    return 'Sold out';
  }
  if (product.stock <= 5) {
    return 'Only ' + product.stock + ' left';
  }
  return 'In stock';
}

// localStorage only stores text, so we convert the list to text (JSON) when saving
// and back to a list when loading. try/catch stops the page breaking if storage is blocked.
function loadList(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved) {
      return saved;
    }
  } catch (error) {
    console.log('Could not read localStorage');
  }
  return [];
}

function saveList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (error) {
    console.log('Could not save to localStorage');
  }
}

function isInWishlist(id) {
  return wishlist.indexOf(id) !== -1;
}


/* ---------- 4. SEARCH, FILTER AND SORT ---------- */

// Returns only the products that match the category and the search words, in the chosen order
function getVisibleProducts() {
  const words = searchText.trim().toLowerCase();
  const result = [];

  for (let i = 0; i < allProducts.length; i++) {
    const product = allProducts[i];

    // Does the category match?
    let categoryMatches = false;
    if (selectedCategory === 'all' || product.category === selectedCategory) {
      categoryMatches = true;
    }

    // Does the search text appear in the name, description, category, tags or colors?
    const searchable = (product.name + ' ' + product.description + ' ' + getCategoryName(product.category) + ' ' + product.tags.join(' ') + ' ' + product.colors.join(' ')).toLowerCase();
    let searchMatches = false;
    if (words === '' || searchable.indexOf(words) !== -1) {
      searchMatches = true;
    }

    if (categoryMatches && searchMatches) {
      result.push(product);
    }
  }

  sortProducts(result);
  return result;
}

// Puts the list in order. A "compare function" returns a negative number if a comes first,
// a positive number if b comes first.
function sortProducts(list) {
  if (sortBy === 'price-asc') {
    list.sort(function (a, b) { return a.price - b.price; });
  } else if (sortBy === 'price-desc') {
    list.sort(function (a, b) { return b.price - a.price; });
  } else if (sortBy === 'newest') {
    list.sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });
  } else {
    // featured products first
    list.sort(function (a, b) { return Number(b.isFeatured) - Number(a.isFeatured); });
  }
}


/* ---------- 5. SHOWING PRODUCTS ---------- */

// Builds the HTML text for one product card
function buildCardHTML(product, index) {
  // Badge in the corner
  let badge = '';
  if (product.stock === 0) {
    badge = '<span class="badge">SOLD OUT</span>';
  } else if (product.isNew) {
    badge = '<span class="badge new">NEW</span>';
  } else if (product.stock <= 5) {
    badge = '<span class="badge">LIMITED</span>';
  }

  // Extra classes: sold out, and highlight/dim for the timeline feature
  let extraClasses = '';
  if (product.stock === 0) {
    extraClasses = ' sold';
  }
  if (activeTimeline !== '') {
    if (product.timelines.indexOf(activeTimeline) !== -1) {
      extraClasses += ' hl';
    } else {
      extraClasses += ' dim';
    }
  }

  // Heart button
  let heart = '♡';
  if (isInWishlist(product.id)) {
    heart = '♥';
  }

  // Small color dots
  let dots = '';
  for (let i = 0; i < product.colors.length; i++) {
    const colorName = product.colors[i];
    dots += '<i class="dot" title="' + colorName + '" style="background:' + COLORS[colorName] + '"></i>';
  }

  return '<article class="card' + extraClasses + '" style="animation-delay:' + (index * 70) + 'ms">' +
    '<button class="ph" data-open="' + product.id + '" aria-label="Quick view ' + product.name + '">' +
    '<img src="' + product.images[0] + '" alt="" loading="lazy">' +
    '<img src="' + product.images[1] + '" alt="" loading="lazy">' +
    badge + '</button>' +
    '<button class="wish" data-wish="' + product.id + '" aria-pressed="' + isInWishlist(product.id) + '" aria-label="Save ' + product.name + ' to wishlist">' + heart + '</button>' +
    '<div class="info">' +
    '<p class="cap">' + getCategoryName(product.category) + ' / ' + getStockText(product) + '</p>' +
    '<h3>' + product.name + '</h3>' +
    '<p class="price">' + formatPrice(product.price) + ' <span class="dots">' + dots + '</span></p>' +
    '</div></article>';
}

// Draws the product grid on the page
function renderGrid() {
  updateFilterButtons();
  const list = getVisibleProducts();

  if (list.length === 0) {
    grid.innerHTML = '';
    grid.hidden = true;
    gridState.innerHTML = 'Nothing found.<br>Try another search or category.';
    gridState.hidden = false;
    resultCount.textContent = '';
    return;
  }

  let html = '';
  for (let i = 0; i < list.length; i++) {
    html += buildCardHTML(list[i], i);
  }
  grid.innerHTML = html;
  grid.hidden = false;
  gridState.hidden = true;

  if (list.length === 1) {
    resultCount.textContent = '1 piece';
  } else {
    resultCount.textContent = list.length + ' pieces';
  }
}

// Creates the category buttons (All + the 6 categories)
function renderFilters() {
  let html = '<button data-filter="all" aria-pressed="true">All</button>';
  for (let i = 0; i < CATEGORIES.length; i++) {
    html += '<button data-filter="' + CATEGORIES[i].id + '" aria-pressed="false">' + CATEGORIES[i].name + '</button>';
  }
  filterBox.innerHTML = html;
}

// Marks only the chosen category button as active (aria-pressed="true" is styled pink/purple in CSS)
function updateFilterButtons() {
  const buttons = document.querySelectorAll('[data-filter]');
  for (let i = 0; i < buttons.length; i++) {
    if (buttons[i].dataset.filter === selectedCategory) {
      buttons[i].setAttribute('aria-pressed', 'true');
    } else {
      buttons[i].setAttribute('aria-pressed', 'false');
    }
  }
}


/* ---------- 6. QUICK-VIEW DIALOG ---------- */

// Builds one row of option buttons (used for colors and sizes)
function buildOptionsHTML(title, type, values, selectedValue) {
  let html = '<p><strong>' + title + '</strong></p><div class="opts" role="radiogroup" aria-label="' + title + '">';
  for (let i = 0; i < values.length; i++) {
    let checked = 'false';
    if (values[i] === selectedValue) {
      checked = 'true';
    }
    html += '<button class="opt" role="radio" aria-checked="' + checked + '" data-' + type + '="' + values[i] + '">' + values[i] + '</button>';
  }
  return html + '</div>';
}

function openProduct(id) {
  const product = findProduct(id);
  if (product === null) {
    return;
  }

  // If there is only one size, pick it automatically
  chosenSize = null;
  if (product.sizes.length === 1) {
    chosenSize = product.sizes[0];
  }
  chosenColor = product.colors[0];

  let buttonText = 'ADD TO BAG';
  let disabled = '';
  if (product.stock === 0) {
    buttonText = 'SOLD OUT';
    disabled = 'disabled';
  }

  productBody.innerHTML =
    '<div class="pd" data-id="' + product.id + '">' +
    '<img src="' + product.images[0] + '" alt="' + product.name + '">' +
    '<div>' +
    '<p class="cap">' + getCategoryName(product.category) + ' / ' + getStockText(product) + '</p>' +
    '<h2>' + product.name + '</h2>' +
    '<p><strong>' + formatPrice(product.price) + '</strong></p>' +
    '<p>' + product.description + '</p>' +
    buildOptionsHTML('Color', 'color', product.colors, chosenColor) +
    buildOptionsHTML('Size', 'size', product.sizes, chosenSize) +
    '<p class="err" id="size-err" role="alert"></p>' +
    '<button class="btn" data-add ' + disabled + '>' + buttonText + ' <i>↗</i></button>' +
    '</div></div>';

  productDialog.showModal();   // opens the pop-up
  document.body.classList.add('no-scroll');   // freeze the page behind it
}

// Clicks inside the quick-view dialog: choosing a size/color or pressing "Add to bag"
function handleDialogClick(event) {
  const option = event.target.closest('.opt');
  if (option) {
    if (option.dataset.size) {
      chosenSize = option.dataset.size;
      document.querySelector('#size-err').textContent = '';
    } else {
      chosenColor = option.dataset.color;
    }
    // Only the clicked button in this row becomes "checked"
    const row = option.parentElement.querySelectorAll('.opt');
    for (let i = 0; i < row.length; i++) {
      if (row[i] === option) {
        row[i].setAttribute('aria-checked', 'true');
      } else {
        row[i].setAttribute('aria-checked', 'false');
      }
    }
  }

  if (event.target.closest('[data-add]')) {
    if (chosenSize === null) {
      document.querySelector('#size-err').textContent = 'Choose a size first.';
      return;
    }
    addToCart(document.querySelector('.pd').dataset.id, chosenSize, chosenColor);
  }
}


/* ---------- 7. SHOPPING BAG (CART) ---------- */

// How many of this product (any size/color) are already in the bag
function countInCart(id) {
  let total = 0;
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].id === id) {
      total += cart[i].qty;
    }
  }
  return total;
}

// Finds the cart line with the same product, size and color
function findCartLine(id, size, color) {
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].id === id && cart[i].size === size && cart[i].color === color) {
      return cart[i];
    }
  }
  return null;
}

function addToCart(id, size, color) {
  const product = findProduct(id);
  if (product === null || product.stock === 0) {
    return;
  }

  // Stock check: do not allow more than the stock
  if (countInCart(id) + 1 > product.stock) {
    showToast('Only ' + product.stock + ' in stock.');
    return;
  }

  const line = findCartLine(id, size, color);
  if (line !== null) {
    line.qty = line.qty + 1;
  } else {
    cart.push({ id: id, size: size, color: color, qty: 1 });
  }

  saveList('offscript_y2k_cart', cart);
  renderCart();
  showToast(product.name + ' added to bag ✦');

  // Little bounce on the bag number
  const badge = document.querySelector('#cart-count');
  badge.classList.remove('bag-bump');
  void badge.offsetWidth;          // forces the browser to restart the animation
  badge.classList.add('bag-bump');
}

// delta is +1 (plus button), -1 (minus button) or minus the whole quantity (remove button)
function changeQuantity(id, size, color, delta) {
  const line = findCartLine(id, size, color);
  const product = findProduct(id);
  if (line === null || product === null) {
    return;
  }

  line.qty = line.qty + delta;

  // Stock check
  const otherLines = countInCart(id) - line.qty;
  if (line.qty > product.stock - otherLines) {
    line.qty = product.stock - otherLines;
    showToast('Only ' + product.stock + ' in stock.');
  }

  // If quantity reaches 0, remove the line
  if (line.qty <= 0) {
    const newCart = [];
    for (let i = 0; i < cart.length; i++) {
      if (cart[i] !== line) {
        newCart.push(cart[i]);
      }
    }
    cart = newCart;
  }

  saveList('offscript_y2k_cart', cart);
  renderCart();
}

// HTML shown when the bag or wishlist is empty
function buildEmptyHTML(title, text) {
  return '<div class="empty"><span class="orb"></span><h3>' + title + '</h3><p>' + text + '</p>' +
    '<a class="btn" href="#shop" data-close>BROWSE THE CLOSET <i>↗</i></a></div>';
}

// Draws the bag: each line, the subtotal and the number on the Bag button
function renderCart() {
  let html = '';
  let total = 0;
  let itemCount = 0;

  for (let i = 0; i < cart.length; i++) {
    const line = cart[i];
    const product = findProduct(line.id);
    if (product === null) {
      continue;   // product no longer exists, skip it
    }
    total += product.price * line.qty;
    itemCount += line.qty;

    const dataAttributes = 'data-id="' + line.id + '" data-size="' + line.size + '" data-color="' + line.color + '"';
    html += '<div class="line">' +
      '<img src="' + product.images[0] + '" alt="">' +
      '<div class="line-info">' +
      '<p><strong>' + product.name + '</strong></p>' +
      '<p class="note">' + line.color + ' · Size ' + line.size + ' · ' + formatPrice(product.price) + '</p>' +
      '<div class="qty">' +
      '<button data-qty="-1" ' + dataAttributes + ' aria-label="Decrease quantity">−</button>' +
      '<span>' + line.qty + '</span>' +
      '<button data-qty="1" ' + dataAttributes + ' aria-label="Increase quantity">+</button>' +
      '<button class="link" data-qty="' + (-line.qty) + '" ' + dataAttributes + '>Remove</button>' +
      '</div></div></div>';
  }

  if (html === '') {
    html = buildEmptyHTML('Your bag is empty', 'Nothing here from the future yet.');
  }

  document.querySelector('#cart-items').innerHTML = html;
  document.querySelector('#cart-total').textContent = formatPrice(total);
  document.querySelector('#cart-count').textContent = itemCount;
  document.querySelector('#checkout').disabled = (itemCount === 0);
}


/* ---------- 8. WISHLIST ---------- */

function toggleWishlist(id) {
  const wasSaved = isInWishlist(id);

  if (wasSaved) {
    // remove: build a new list without this id
    const newList = [];
    for (let i = 0; i < wishlist.length; i++) {
      if (wishlist[i] !== id) {
        newList.push(wishlist[i]);
      }
    }
    wishlist = newList;
    showToast('Removed from wishlist.');
  } else {
    wishlist.push(id);
    showToast('Saved to wishlist ♥');
  }

  saveList('offscript_y2k_wish', wishlist);
  renderWishlist();

  // Update the heart buttons on the cards without redrawing the whole grid
  const hearts = document.querySelectorAll('.wish');
  for (let i = 0; i < hearts.length; i++) {
    if (hearts[i].dataset.wish === id) {
      hearts[i].setAttribute('aria-pressed', String(!wasSaved));
      if (wasSaved) {
        hearts[i].textContent = '♡';
      } else {
        hearts[i].textContent = '♥';
      }
      hearts[i].classList.remove('pop');
      void hearts[i].offsetWidth;
      hearts[i].classList.add('pop');
    }
  }
}

function renderWishlist() {
  let html = '';
  let count = 0;

  for (let i = 0; i < wishlist.length; i++) {
    const product = findProduct(wishlist[i]);
    if (product === null) {
      continue;
    }
    count++;
    html += '<div class="line">' +
      '<img src="' + product.images[0] + '" alt="">' +
      '<div class="line-info">' +
      '<p><strong>' + product.name + '</strong></p>' +
      '<p class="note">' + formatPrice(product.price) + ' · ' + getStockText(product) + '</p>' +
      '<div class="qty">' +
      '<button class="link" data-open="' + product.id + '">Quick view</button>' +
      '<button class="link" data-wish="' + product.id + '">Remove</button>' +
      '</div></div></div>';
  }

  if (html === '') {
    html = buildEmptyHTML('No favourites yet', 'Tap a heart on any piece to save it here.');
  }

  document.querySelector('#wish-items').innerHTML = html;
  document.querySelector('#wish-count').textContent = count;
}


/* ---------- 9. NEWSLETTER FORM ---------- */

// Simple email check: needs an @ that is not first, a dot after it, and no spaces
function isValidEmail(email) {
  const at = email.indexOf('@');
  const dot = email.lastIndexOf('.');
  if (email === '' || email.indexOf(' ') !== -1) {
    return false;
  }
  if (at < 1 || dot < at + 2 || dot === email.length - 1) {
    return false;
  }
  return true;
}

function handleNewsletter(event) {
  event.preventDefault();   // stop the page from reloading
  const input = document.querySelector('#news-email');
  const error = document.querySelector('#news-email-err');
  const success = document.querySelector('#news-ok');
  success.textContent = '';

  if (isValidEmail(input.value.trim())) {
    error.textContent = '';
    input.setAttribute('aria-invalid', 'false');
    // FUTURE (backend): send the email with fetch(API_BASE_URL + '/api/newsletter', ...)
    success.textContent = 'Frontend demo: looks good, but nothing was subscribed.';
    input.value = '';
  } else {
    error.textContent = 'Enter a valid email address.';
    input.setAttribute('aria-invalid', 'true');
  }
}


/* ---------- 10. CHOOSE YOUR TIMELINE ---------- */

function renderTimelineTabs() {
  let html = '';
  for (let i = 0; i < TIMELINES.length; i++) {
    html += '<button class="tl-tab" role="radio" aria-checked="false" data-tl="' + TIMELINES[i].id + '">' + TIMELINES[i].name + '</button>';
  }
  document.querySelector('#tl-tabs').innerHTML = html;
}

// highlight = true means the matching products in the shop should glow
function selectTimeline(id, highlight) {
  let timeline = TIMELINES[0];
  for (let i = 0; i < TIMELINES.length; i++) {
    if (TIMELINES[i].id === id) {
      timeline = TIMELINES[i];
    }
  }

  if (highlight) {
    activeTimeline = timeline.id;
  } else {
    activeTimeline = '';
  }

  // Change the two background colors (CSS fades between them)
  const section = document.querySelector('#timeline');
  section.style.setProperty('--a', timeline.color1);
  section.style.setProperty('--b', timeline.color2);

  // Mark the chosen tab
  const tabs = document.querySelectorAll('.tl-tab');
  for (let i = 0; i < tabs.length; i++) {
    if (tabs[i].dataset.tl === timeline.id) {
      tabs[i].setAttribute('aria-checked', 'true');
    } else {
      tabs[i].setAttribute('aria-checked', 'false');
    }
  }

  // Fade the picture out, swap it, fade it back in
  const frame = document.querySelector('.tl-frame');
  const picture = document.querySelector('#tl-img');
  frame.classList.add('swap');
  setTimeout(function () {
    picture.src = timeline.image;
    picture.alt = timeline.name + ' mood image';
    frame.classList.remove('swap');
  }, 280);

  document.querySelector('#tl-name').textContent = timeline.name;
  document.querySelector('#tl-desc').textContent = timeline.desc;

  // List the products that belong to this timeline
  const names = [];
  for (let i = 0; i < allProducts.length; i++) {
    if (allProducts[i].timelines.indexOf(timeline.id) !== -1) {
      names.push(allProducts[i].name);
    }
  }
  document.querySelector('#tl-picks').textContent = 'Highlighted in the closet: ' + names.join(', ');

  renderGrid();   // redraw so matching cards glow and others fade
}


/* ---------- 11. DRAWERS, MENU AND TOAST ---------- */

function openDrawer(drawer) {
  closeDrawers();
  lastFocusedButton = document.activeElement;
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  overlay.classList.add('open');
  drawer.querySelector('.close').focus();
}

function closeDrawers() {
  const wasOpen = cartDrawer.classList.contains('open') || wishDrawer.classList.contains('open');
  cartDrawer.classList.remove('open');
  wishDrawer.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  wishDrawer.setAttribute('aria-hidden', 'true');
  overlay.classList.remove('open');
  if (wasOpen && lastFocusedButton) {
    lastFocusedButton.focus();
  }
}

// Mobile menu: show or hide
function setMenu(isOpen) {
  if (isOpen) {
    menu.classList.add('open');
  } else {
    menu.classList.remove('open');
  }
  menuButton.setAttribute('aria-expanded', String(isOpen));
}

// Small message at the bottom of the screen for 2.2 seconds
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.classList.remove('show');
  }, 2200);
}


/* ---------- 12. SCROLL EFFECTS, TICKER, CURSOR ---------- */

// Runs every time the user scrolls
function handleScroll() {
  // Header gets a bigger shadow after scrolling a little
  if (window.scrollY > 40) {
    header.classList.add('stuck');
  } else {
    header.classList.remove('stuck');
  }

  // Back-to-top button appears after scrolling 700px
  if (window.scrollY > 700) {
    toTopButton.classList.add('show');
  } else {
    toTopButton.classList.remove('show');
  }

  revealOnScroll();
  moveParallax();
}

// Adds the class "in" to elements when they come into view. The CSS then plays their animation.
function revealOnScroll() {
  const items = document.querySelectorAll('[data-reveal]');
  for (let i = 0; i < items.length; i++) {
    const top = items[i].getBoundingClientRect().top;
    if (top < window.innerHeight * 0.85) {
      items[i].classList.add('in');
    }
  }
}

// Parallax: decorations and photos move slightly slower/faster than the page
function moveParallax() {
  if (reducedMotion) {
    return;
  }
  const items = document.querySelectorAll('[data-parallax], [data-px]');
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Photos inside a frame: measure the frame instead
    let measured = item;
    let insideFrame = false;
    if (item.parentElement.classList.contains('frame')) {
      measured = item.parentElement;
      insideFrame = true;
    }

    const box = measured.getBoundingClientRect();
    if (box.bottom < -200 || box.top > window.innerHeight + 200) {
      continue;   // far off screen, skip it
    }
    // distance of the element's middle from the middle of the screen
    const distance = box.top + box.height / 2 - window.innerHeight / 2;

    if (item.dataset.px) {
      item.style.transform = 'translateX(' + (-distance * Number(item.dataset.px)) + 'px)';   // sideways (big background word)
    } else {
      let move = 'translateY(' + (distance * Number(item.dataset.parallax)) + 'px)';
      if (insideFrame) {
        move += ' scale(1.1)';
      }
      item.style.transform = move;
    }
  }
}

// Builds the moving strip. The phrases are written twice so the loop has no gap.
function buildTicker() {
  const phrases = ['NO RULES. NEW TIMELINE.', '✦ OFFSCRIPT ARCHIVE ✦', 'YOUR FUTURE FIT STARTS HERE', '✦'];
  let html = '';
  for (let round = 0; round < 4; round++) {
    for (let i = 0; i < phrases.length; i++) {
      html += '<span>' + phrases[i] + '</span>';
    }
  }
  document.querySelector('#track').innerHTML = html;
}

// Buttons with data-magnet move slightly towards the mouse
function setupMagneticButtons() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || reducedMotion) {
    return;   // not for touch screens
  }
  const buttons = document.querySelectorAll('[data-magnet]');
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    button.addEventListener('mousemove', function (event) {
      const box = button.getBoundingClientRect();
      const x = (event.clientX - box.left - box.width / 2) * 0.2;
      const y = (event.clientY - box.top - box.height / 2) * 0.3;
      button.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    });
    button.addEventListener('mouseleave', function () {
      button.style.transform = '';
    });
  }
}

// Custom cursor: a dot, a ring that follows it, and little sparkles
function setupCursor() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || reducedMotion) {
    return;   // not for touch screens
  }
  const dot = document.querySelector('#cur-dot');
  const ring = document.querySelector('#cur-ring');
  const sparkleColors = [PINK, BLUE, PURPLE, SILVER];
  let lastSparkleTime = 0;
  document.body.classList.add('has-cursor');

  document.addEventListener('mousemove', function (event) {
    const x = event.clientX + 'px';
    const y = event.clientY + 'px';
    dot.style.left = x;
    dot.style.top = y;
    ring.style.left = x;   // CSS "transition" makes the ring follow a little late
    ring.style.top = y;

    // What is the mouse over? Choose the ring style.
    ring.className = '';
    dot.className = '';
    ring.textContent = '';
    if (event.target.closest('input, select, dialog')) {   // dialog: normal cursor is shown there
      ring.className = 'off';
      dot.className = 'off';
    } else if (event.target.closest('.ph, .frame, .tl-frame, .arch')) {
      ring.className = 'view';
      ring.textContent = 'VIEW';
    } else if (event.target.closest('a, button, label')) {
      ring.className = 'hover';
    }

    // Create a sparkle at most every 70 milliseconds
    const now = Date.now();
    if (now - lastSparkleTime > 70 && ring.className !== 'off') {
      lastSparkleTime = now;
      const sparkle = document.createElement('span');
      sparkle.className = 'spark';
      sparkle.textContent = '✦';
      sparkle.style.left = x;
      sparkle.style.top = y;
      sparkle.style.color = sparkleColors[Math.floor(Math.random() * 4)];
      document.body.appendChild(sparkle);
      setTimeout(function () { sparkle.remove(); }, 900);
    }
  });

  document.addEventListener('mouseleave', function () {
    ring.className = 'off';
    dot.className = 'off';
  });
}


/* ---------- 13. CLICK HANDLING AND START-UP ---------- */

// If a picture file is missing (not added yet or the name is wrong), show a colorful placeholder
// that prints the path it was looking for, instead of a broken-image icon.
let fallbackCount = 0;
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
function handleImageError(event) {
  const img = event.target;
  if (img.tagName !== 'IMG' || img.dataset.fallback) {
    return;   // only handle pictures, and only once each
  }
  const currentSrc = img.getAttribute('src') || '';

  // Your files are in the assets folder, but they may be .png, .jpg or .webp.
  // Before giving up, quietly try the other extensions for the same file name.
  const match = currentSrc.match(/^(assets\/.+?)(\.[a-z0-9]+)$/i);
  if (match) {
    const base = img.dataset.base || match[1];
    img.dataset.base = base;
    const tried = Number(img.dataset.extTry || 0);
    if (tried < IMAGE_EXTENSIONS.length) {
      img.dataset.extTry = tried + 1;
      const next = base + IMAGE_EXTENSIONS[tried];
      if (next.toLowerCase() === currentSrc.toLowerCase()) {
        // same file we just tried: skip ahead to the next extension
        img.dataset.extTry = tried + 2;
        if (tried + 1 < IMAGE_EXTENSIONS.length) {
          img.src = base + IMAGE_EXTENSIONS[tried + 1];
          return;
        }
      } else {
        img.src = next;
        return;
      }
    }
  }

  img.dataset.fallback = 'yes';
  const wantedPath = (img.dataset.base || currentSrc).replace(/[<>&"]/g, '');
  img.src = makePlaceholder(fallbackCount, 'ADD PHOTO', wantedPath);
  fallbackCount++;
}


// ONE click listener for the whole page ("event delegation").
// closest() checks whether the clicked element (or a parent) has a certain attribute.
function handleClick(event) {
  const target = event.target;

  const openButton = target.closest('[data-open]');
  const wishButton = target.closest('[data-wish]');
  const qtyButton = target.closest('[data-qty]');
  const filterButton = target.closest('[data-filter]');
  const timelineButton = target.closest('[data-tl]');

  if (openButton) {
    closeDrawers();
    openProduct(openButton.dataset.open);
  } else if (wishButton) {
    toggleWishlist(wishButton.dataset.wish);
  } else if (qtyButton) {
    changeQuantity(qtyButton.dataset.id, qtyButton.dataset.size, qtyButton.dataset.color, Number(qtyButton.dataset.qty));
  } else if (filterButton) {
    selectedCategory = filterButton.dataset.filter;
    renderGrid();
  } else if (timelineButton) {
    selectTimeline(timelineButton.dataset.tl, true);
  } else if (target.closest('[data-close]') || target.id === 'overlay') {
    closeDrawers();
  } else if (target.closest('[data-dclose]')) {
    productDialog.close();
  } else if (target.closest('[data-soon]')) {
    event.preventDefault();
    showToast('Demo site: this page does not exist yet.');
  }

  // Clicking a link in the mobile menu closes the menu
  if (target.closest('#menu a')) {
    setMenu(false);
  }
}

// Connects every button and input to its function
function setupEvents() {
  document.addEventListener('click', handleClick);
  document.addEventListener('error', handleImageError, true);   // 'true' is needed because image errors do not bubble
  // When the dialog closes (Close button, Escape key...), let the page scroll again
  productDialog.addEventListener('close', function () {
    document.body.classList.remove('no-scroll');
  });
  productBody.addEventListener('click', handleDialogClick);

  searchInput.addEventListener('input', function () {
    searchText = searchInput.value;
    renderGrid();
  });
  sortSelect.addEventListener('change', function () {
    sortBy = sortSelect.value;
    renderGrid();
  });

  menuButton.addEventListener('click', function () {
    setMenu(!menu.classList.contains('open'));
  });
  document.querySelector('#btn-search').addEventListener('click', function () {
    document.querySelector('#shop').scrollIntoView();
    searchInput.focus({ preventScroll: true });
  });
  document.querySelector('#btn-cart').addEventListener('click', function () { openDrawer(cartDrawer); });
  document.querySelector('#btn-wish').addEventListener('click', function () { openDrawer(wishDrawer); });
  toTopButton.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  document.querySelector('#checkout').addEventListener('click', function () {
    // FUTURE (backend): send the order to the server. The server must re-check prices and stock.
    document.querySelector('#checkout-note').textContent = 'Demo only: no order was created and no payment was taken.';
    showToast('Demo checkout. No real order.');
  });

  document.querySelector('#news-form').addEventListener('submit', handleNewsletter);

  // Escape key closes drawers and the mobile menu
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeDrawers();
      setMenu(false);
    }
  });

  window.addEventListener('scroll', handleScroll);
}

// START-UP: runs once when the page loads
async function startWebsite() {
  let loadFailed = false;

  gridState.textContent = 'Loading pieces...';
  gridState.hidden = false;

  try {
    allProducts = await getProducts();
  } catch (error) {
    console.log(error);
    allProducts = [];
    loadFailed = true;
  }

  // Put the pictures from the assets folder into the page
  // Hero (arch photo at the top of the page)
  document.querySelector('#hero-img').src = 'assets/header.png';
  // Editorial section: big photo, then two small photos
  document.querySelector('#ed-img').src = 'assets/img 3.png';
  document.querySelector('#ed-img2').src = 'assets/img 5.png';
  document.querySelector('#ed-img3').src = 'assets/img 1.png';

  buildTicker();
  renderFilters();
  renderTimelineTabs();
  selectTimeline(TIMELINES[0].id, false);   // show the first timeline, but do not dim the shop yet
  renderCart();
  renderWishlist();

  setupEvents();
  setupMagneticButtons();
  setupCursor();
  handleScroll();   // run once so things already on screen appear
  if (loadFailed) {
    grid.hidden = true;
    gridState.innerHTML = 'Could not load products.<br>Run the site with Live Server.';
    gridState.hidden = false;
    resultCount.textContent = '';
  }
  // Start the hero entrance animation shortly after load
  setTimeout(function () {
    document.body.classList.add('ready');
  }, 50);
}

startWebsite();