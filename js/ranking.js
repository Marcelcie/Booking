const rankingData = {
  topRated: [
    {
      title: "Hotel Kraków Premium",
      type: "Hotel",
      location: "Kraków",
      ratingLabel: "Fantastyczny",
      rating: 9.8,
      reviews: 1824,
      price: 520,
      stars: 5,
      description: "Jeden z najlepiej ocenianych obiektów w mieście. Świetna lokalizacja, wysoki standard i doskonałe opinie gości.",
      image: "https://picsum.photos/seed/rank1/600/400"
    },
    {
      title: "Apartament Gdańsk Sea View",
      type: "Apartament",
      location: "Gdańsk",
      ratingLabel: "Fantastyczny",
      rating: 9.6,
      reviews: 1532,
      price: 470,
      stars: 4,
      description: "Bardzo wysoko oceniany apartament blisko morza, idealny na wypoczynek dla par i rodzin.",
      image: "https://picsum.photos/seed/rank2/600/400"
    },
    {
      title: "Domek Zakopane View",
      type: "Domek",
      location: "Zakopane",
      ratingLabel: "Wspaniały",
      rating: 9.4,
      reviews: 1410,
      price: 560,
      stars: 5,
      description: "Klimatyczny domek z pięknym widokiem na góry. Często wybierany przez osoby szukające odpoczynku.",
      image: "https://picsum.photos/seed/rank3/600/400"
    },
    {
      title: "Villa Mazury Relax",
      type: "Villa",
      location: "Mazury",
      ratingLabel: "Wspaniały",
      rating: 9.2,
      reviews: 1094,
      price: 430,
      stars: 4,
      description: "Obiekt ceniony za spokojną lokalizację i komfortowy pobyt nad jeziorem.",
      image: "https://picsum.photos/seed/rank4/600/400"
    },
    {
      title: "Wellness Spa Resort",
      type: "Resort",
      location: "Kołobrzeg",
      ratingLabel: "Wspaniały",
      rating: 9.1,
      reviews: 988,
      price: 610,
      stars: 5,
      description: "Resort premium dla osób szukających wypoczynku, spa i wysokiej jakości obsługi.",
      image: "https://picsum.photos/seed/rank5/600/400"
    }
  ],

  popular: [
    {
      title: "Hotel Warszawa Centrum",
      type: "Hotel",
      location: "Warszawa",
      ratingLabel: "Bardzo dobry",
      rating: 8.9,
      reviews: 2840,
      price: 390,
      stars: 4,
      description: "Jeden z najczęściej wybieranych hoteli w stolicy, popularny wśród turystów i osób podróżujących służbowo.",
      image: "https://picsum.photos/seed/pop1/600/400"
    },
    {
      title: "Apartament Sopot Beach",
      type: "Apartament",
      location: "Sopot",
      ratingLabel: "Wspaniały",
      rating: 9.1,
      reviews: 2310,
      price: 520,
      stars: 5,
      description: "Bardzo popularny apartament blisko morza, często wybierany w sezonie wakacyjnym.",
      image: "https://picsum.photos/seed/pop2/600/400"
    },
    {
      title: "Hostel City Wrocław",
      type: "Hostel",
      location: "Wrocław",
      ratingLabel: "Dobry",
      rating: 8.1,
      reviews: 1980,
      price: 180,
      stars: 3,
      description: "Popularny wybór dla studentów, grup i osób szukających tańszego noclegu w centrum.",
      image: "https://picsum.photos/seed/pop3/600/400"
    },
    {
      title: "Pensjonat Białka Comfort",
      type: "Pensjonat",
      location: "Białka Tatrzańska",
      ratingLabel: "Bardzo dobry",
      rating: 8.8,
      reviews: 1765,
      price: 260,
      stars: 4,
      description: "Często wybierany obiekt przez rodziny i osoby planujące wyjazdy w góry.",
      image: "https://picsum.photos/seed/pop4/600/400"
    },
    {
      title: "Villa Gdynia Port",
      type: "Villa",
      location: "Gdynia",
      ratingLabel: "Wspaniały",
      rating: 9.0,
      reviews: 1650,
      price: 340,
      stars: 4,
      description: "Popularny obiekt nad morzem, ceniony za lokalizację i wygodne pokoje.",
      image: "https://picsum.photos/seed/pop5/600/400"
    }
  ],

  cheapest: [
    {
      title: "Hostel Budget Kraków",
      type: "Hostel",
      location: "Kraków",
      ratingLabel: "Dobry",
      rating: 7.9,
      reviews: 860,
      price: 120,
      stars: 3,
      description: "Jedna z najtańszych opcji w mieście, dobra dla studentów i krótkich pobytów.",
      image: "https://picsum.photos/seed/cheap1/600/400"
    },
    {
      title: "Pensjonat Relax Łódź",
      type: "Pensjonat",
      location: "Łódź",
      ratingLabel: "Dobry",
      rating: 8.0,
      reviews: 740,
      price: 150,
      stars: 3,
      description: "Przystępna cenowo opcja dla osób szukających prostego i wygodnego noclegu.",
      image: "https://picsum.photos/seed/cheap2/600/400"
    },
    {
      title: "Apartament Start Poznań",
      type: "Apartament",
      location: "Poznań",
      ratingLabel: "Bardzo dobry",
      rating: 8.3,
      reviews: 690,
      price: 190,
      stars: 4,
      description: "Niedrogi apartament w dobrej lokalizacji, popularny na krótkie pobyty.",
      image: "https://picsum.photos/seed/cheap3/600/400"
    },
    {
      title: "Domek Basic Karpacz",
      type: "Domek",
      location: "Karpacz",
      ratingLabel: "Dobry",
      rating: 8.0,
      reviews: 605,
      price: 210,
      stars: 3,
      description: "Tani domek dla osób, które stawiają na prosty nocleg i bliskość natury.",
      image: "https://picsum.photos/seed/cheap4/600/400"
    },
    {
      title: "Hotel Economy Gdańsk",
      type: "Hotel",
      location: "Gdańsk",
      ratingLabel: "Bardzo dobry",
      rating: 8.5,
      reviews: 590,
      price: 230,
      stars: 4,
      description: "Ekonomiczny hotel oferujący dobry standard w rozsądnej cenie.",
      image: "https://picsum.photos/seed/cheap5/600/400"
    }
  ],

  premium: [
    {
      title: "Royal Luxury Palace",
      type: "Hotel",
      location: "Warszawa",
      ratingLabel: "Fantastyczny",
      rating: 9.7,
      reviews: 1210,
      price: 950,
      stars: 5,
      description: "Ekskluzywny hotel premium dla najbardziej wymagających gości.",
      image: "https://picsum.photos/seed/premium1/600/400"
    },
    {
      title: "Sea Premium Residence",
      type: "Apartament",
      location: "Sopot",
      ratingLabel: "Fantastyczny",
      rating: 9.6,
      reviews: 980,
      price: 870,
      stars: 5,
      description: "Luksusowy apartament z wysokim standardem i świetną lokalizacją przy morzu.",
      image: "https://picsum.photos/seed/premium2/600/400"
    },
    {
      title: "Mountain Exclusive Lodge",
      type: "Domek",
      location: "Zakopane",
      ratingLabel: "Fantastyczny",
      rating: 9.5,
      reviews: 865,
      price: 920,
      stars: 5,
      description: "Ekskluzywny domek z panoramicznym widokiem na góry i prywatną strefą relaksu.",
      image: "https://picsum.photos/seed/premium3/600/400"
    },
    {
      title: "Wellness Gold Resort",
      type: "Resort",
      location: "Kołobrzeg",
      ratingLabel: "Wspaniały",
      rating: 9.3,
      reviews: 760,
      price: 880,
      stars: 5,
      description: "Premium resort z bogatą ofertą spa, wellness i wysokiej klasy obsługą.",
      image: "https://picsum.photos/seed/premium4/600/400"
    },
    {
      title: "Villa Prestige Mazury",
      type: "Villa",
      location: "Mazury",
      ratingLabel: "Wspaniały",
      rating: 9.2,
      reviews: 654,
      price: 790,
      stars: 5,
      description: "Luksusowa willa dla osób szukających spokoju, prywatności i wysokiego standardu.",
      image: "https://picsum.photos/seed/premium5/600/400"
    }
  ]
};

const rankingList = document.getElementById("ranking-list");
const rankingTabs = document.querySelectorAll(".ranking-tab");

function renderStars(stars) {
  let result = "";
  for (let i = 1; i <= 5; i++) {
    result += i <= stars
      ? `<span class="star filled">★</span>`
      : `<span class="star">☆</span>`;
  }
  return result;
}

function getPlaceClass(index) {
  if (index === 0) return "gold";
  if (index === 1) return "silver";
  if (index === 2) return "bronze";
  return "";
}

function getCardClass(index) {
  if (index === 0) return "first-place";
  if (index === 1) return "second-place";
  if (index === 2) return "third-place";
  return "";
}

function renderRanking(tabName) {
  const items = rankingData[tabName];

  rankingList.innerHTML = items.map((item, index) => `
    <article class="ranking-card ${getCardClass(index)}">
      <div class="ranking-position ${getPlaceClass(index)}">${index + 1}</div>

      <div class="ranking-image">
        <img src="${item.image}" alt="${item.title}" />
      </div>

      <div class="ranking-content">
        <div class="ranking-main">
          <span class="offer-type-badge">${item.type}</span>
          <h3>${item.title}</h3>
          <p class="offer-result-location">📍 ${item.location}</p>

          <div class="offer-stars-row">
            <div class="offer-stars">
              ${renderStars(item.stars)}
            </div>
            <span class="offer-stars-text">${item.stars}/5</span>
          </div>

          <p class="ranking-description">${item.description}</p>
        </div>

        <div class="ranking-side">
          <p class="offer-rating-label">${item.ratingLabel}</p>
          <div class="offer-rating">${item.rating}</div>
          <p class="offer-reviews">${item.reviews} opinii</p>
          <strong class="ranking-price">Od ${item.price} zł</strong>
          <a href="oferta-szczegoly.html" class="offer-btn">Zobacz ofertę</a>
        </div>
      </div>
    </article>
  `).join("");
}

rankingTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    rankingTabs.forEach(btn => btn.classList.remove("active"));
    tab.classList.add("active");
    renderRanking(tab.dataset.tab);
  });
});

renderRanking("topRated");