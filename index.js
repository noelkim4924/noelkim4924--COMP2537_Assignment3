const PAGE_SIZE = 10;
let currentPage = 1;
let pokemons = [];
let types = {};
let selectedTypes = {};

const updatePaginationDiv = (currentPage, numPages) => {
  $("#pagination").empty();

  // show at most 3 page numbers at a time
  let startPage = Math.max(currentPage - 1, 1);
  let endPage = Math.min(startPage + 2, numPages);
  if (endPage - startPage < 2) {
    // adjust startPage and endPage if we have less than 3 pages to show
    endPage = Math.min(startPage + 2, numPages);
    startPage = Math.max(endPage - 2, 1);
  }

  // add previous button if necessary
  if (currentPage > 1) {
    $("#pagination").append(`
      <button class="btn btn-primary page ml-1 numberedButtons" value="${
        currentPage - 1
      }">&lt;</button>
    `);
  }

  // add page buttons
  for (let i = startPage; i <= endPage; i++) {
    $("#pagination").append(`
      <button class="btn btn-primary page ml-1 numberedButtons ${
        i === currentPage ? "active" : ""
      }" value="${i}">${i}</button>
    `);
  }

  // add next button if necessary
  if (currentPage < numPages) {
    $("#pagination").append(`
      <button class="btn btn-primary page ml-1 numberedButtons" value="${
        currentPage + 1
      }">&gt;</button>
    `);
  }
};

const paginate = async (currentPage, PAGE_SIZE, pokemons) => {
  selected_pokemons = pokemons.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  pokemons.forEach(async (pokemon) => {
    const res = await axios.get(pokemon.url);

    res.data.types.forEach((type) => {
      if (types[type.type.name]) {
        types[type.type.name]++;
      } else {
        types[type.type.name] = 1;
        $("#checkbox").append(`
        <div class="form-check">
        <input class="form-check-input typeCheckbox" type="checkbox" value="${
          type.type.name
        }" id="${type.type.name}">
        <label class="form-check-label" for="${type.type.name}">
          ${type.type.name} (${types[type.type.name]})
        </label>
      </div>`);
      }
    });
  });

  $("#pokeCards").empty();
  selected_pokemons.forEach(async (pokemon) => {
    const res = await axios.get(pokemon.url);
    // update types object
    res.data.types.forEach((type) => {
      if (types[type.type.name]) {
        types[type.type.name]++;
      } else {
        types[type.type.name] = 1;
      }
    });

    // create Pokemon card
    $("#pokeCards").append(`
      <div class="pokeCard card" pokeName=${res.data.name}   >
        <h3>${res.data.name.toUpperCase()}</h3> 
        <img src="${res.data.sprites.front_default}" alt="${res.data.name}"/>
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#pokeModal">
          More
        </button>
      </div>  
    `);
  });

  const numPages = Math.ceil(pokemons.length / PAGE_SIZE);
  updatePaginationDiv(currentPage, numPages);

  $("#totalResults").text(pokemons.length);
  $("#currentResults").text(selected_pokemons.length);
};

const setup = async () => {
  // test out poke api using axios here

  $("#pokeCards").empty();
  let response = await axios.get(
    "https://pokeapi.co/api/v2/pokemon?offset=0&limit=810"
  );

  pokemons = response.data.results;

  paginate(currentPage, PAGE_SIZE, pokemons);
  const numPages = Math.ceil(pokemons.length / PAGE_SIZE);
  updatePaginationDiv(currentPage, numPages);

  // pop up modal when clicking on a pokemon card
  // add event listener to each pokemon card
  $("body").on("click", ".pokeCard", async function (e) {
    const pokemonName = $(this).attr("pokeName");
    // console.log("pokemonName: ", pokemonName);
    const res = await axios.get(
      `https://pokeapi.co/api/v2/pokemon/${pokemonName}`
    );
    // console.log("res.data: ", res.data);
    const types = res.data.types.map((type) => type.type.name);
    console.log("types: ", types);
    $(".modal-body").html(`
        <div style="width:200px">
        <img src="${
          res.data.sprites.other["official-artwork"].front_default
        }" alt="${res.data.name}"/>
        <div>
        <h3>Abilities</h3>
        <ul>
        ${res.data.abilities
          .map((ability) => `<li>${ability.ability.name}</li>`)
          .join("")}
        </ul>
        </div>

        <div>
        <h3>Stats</h3>
        <ul>
        ${res.data.stats
          .map((stat) => `<li>${stat.stat.name}: ${stat.base_stat}</li>`)
          .join("")}
        </ul>

        </div>

        </div>
          <h3>Types</h3>
          <ul>
          ${types.map((type) => `<li>${type}</li>`).join("")}
          </ul>
      
        `);
    $(".modal-title").html(`
        <h2>${res.data.name.toUpperCase()}</h2>
        <h5>${res.data.id}</h5>
        `);
  });

  // add event listener to pagination buttons
  $("body").on("click", ".numberedButtons", async function (e) {
    currentPage = Number(e.target.value);
    paginate(currentPage, PAGE_SIZE, pokemons);

    //update pagination buttons
    updatePaginationDiv(currentPage, numPages);
  });

  $(".checkboxes").on("click", async function () {
    selectedTypes = $(".typeCheckbox:checked")
      .map(function () {
        return $(this).val();
      })
      .get();
  
    console.log(selectedTypes);
  
 
    if (selectedTypes.length >= 3) {
        pokemons = [];
      } else if (selectedTypes.length === 2) {
        let response1 = await axios.get(
          `https://pokeapi.co/api/v2/type/${selectedTypes[0]}`
        );
        let response2 = await axios.get(
          `https://pokeapi.co/api/v2/type/${selectedTypes[1]}`
        );
    
        let pokemon1 = response1.data.pokemon.map((p) => p.pokemon);
        let pokemon2 = response2.data.pokemon.map((p) => p.pokemon);
    
        pokemons = pokemon1.filter((p1) =>
          pokemon2.some((p2) => p2.name === p1.name)
        );
      } else if (selectedTypes.length === 1) {
        let response = await axios.get(
          `https://pokeapi.co/api/v2/type/${selectedTypes[0]}`
        );
        pokemons = response.data.pokemon.map((p) => p.pokemon);
      } else {
        pokemons = [];
      }
  
    paginate(currentPage, PAGE_SIZE, pokemons);
  
    const numPages = Math.ceil(pokemons.length / PAGE_SIZE);
    console.log(numPages);
    //update pagination buttons
    updatePaginationDiv(currentPage, numPages);
  });
  

};

$(document).ready(setup);