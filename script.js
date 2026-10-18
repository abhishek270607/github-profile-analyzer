
const form = document.querySelector("#search-form");
const usernameInput = document.querySelector("#username");
const statusText = document.querySelector("#status");
const profileSection = document.querySelector("#profile");
const sortSelect = document.querySelector("#sort");

let repositories = [];

async function fetchGitHub(url) {
  const response = await fetch(url);

  if (response.status === 404) {
    throw new Error("GitHub user or resource not found.");
  }

  if (response.status === 403 || response.status === 429) {
    throw new Error("GitHub API limit reached. Please try again later.");
  }

  if (!response.ok) {
    throw new Error("GitHub request failed. Please try again.");
  }

  return response.json();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();

  if (!username) return;

  profileSection.hidden = true;
  statusText.textContent = "Analyzing GitHub profile...";

  try {
    const user = await fetchGitHub(
      `https://api.github.com/users/${encodeURIComponent(username)}`
    );

    repositories = await fetchGitHub(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`
    );

    // Profile information
    document.querySelector("#avatar").src = user.avatar_url;
    document.querySelector("#name").textContent =
      user.name || user.login;

    document.querySelector("#bio").textContent =
      user.bio || "No bio provided.";

    const profileLink = document.querySelector("#profile-link");
    profileLink.href = user.html_url;

    // Basic statistics
    document.querySelector("#repos").textContent =
      user.public_repos.toLocaleString();

    document.querySelector("#followers").textContent =
      user.followers.toLocaleString();

    document.querySelector("#following").textContent =
      user.following.toLocaleString();

    const totalStars = repositories.reduce(
      (total, repo) => total + repo.stargazers_count,
      0
    );

    document.querySelector("#stars").textContent =
      totalStars.toLocaleString();

    // Count each repository's primary language
    const languageCounts = {};

    repositories.forEach((repo) => {
      if (repo.language) {
        languageCounts[repo.language] =
          (languageCounts[repo.language] || 0) + 1;
      }
    });

    renderLanguages(languageCounts);
    renderRepositories();

    profileSection.hidden = false;

    statusText.textContent =
      `Showing ${repositories.length} recently updated repositories.`;

  } catch (error) {
    statusText.textContent = error.message;
  }
});

function renderLanguages(languageCounts) {
  const container = document.querySelector("#languages");
  container.replaceChildren();

  const languages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1]);

  if (languages.length === 0) {
    container.textContent = "No language data available.";
    return;
  }

  const maxCount = languages[0][1];

  languages.slice(0, 8).forEach(([language, count]) => {
    const row = document.createElement("div");
    row.className = "language-row";

    const label = document.createElement("div");
    label.className = "language-label";

    const name = document.createElement("span");
    name.textContent = language;

    const number = document.createElement("span");
    number.textContent = `${count} repositories`;

    label.append(name, number);

    const bar = document.createElement("div");
    bar.className = "bar";

    const fill = document.createElement("span");
    fill.style.width = `${(count / maxCount) * 100}%`;

    bar.append(fill);
    row.append(label, bar);
    container.append(row);
  });
}

function renderRepositories() {
  const container = document.querySelector("#repositories");
  container.replaceChildren();

  const sortBy = sortSelect.value;

  const sorted = [...repositories].sort((a, b) => {
    if (sortBy === "stars") {
      return b.stargazers_count - a.stargazers_count;
    }

    if (sortBy === "updated") {
      return new Date(b.updated_at) - new Date(a.updated_at);
    }

    return a.name.localeCompare(b.name);
  });

  sorted.forEach((repo) => {
    const card = document.createElement("article");
    card.className = "repo-card";

    const title = document.createElement("h3");
    const link = document.createElement("a");

    link.href = repo.html_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = repo.name;

    title.append(link);

    const description = document.createElement("p");
    description.textContent =
      repo.description || "No description provided.";

    const details = document.createElement("div");
    details.className = "muted";

    const language = repo.language || "Not specified";
    const updated = new Date(repo.updated_at)
      .toLocaleDateString();

    details.textContent =
      `★ ${repo.stargazers_count}  ·  ${language}  ·  Updated ${updated}`;

    card.append(title, description, details);
    container.append(card);
  });

  if (sorted.length === 0) {
    container.textContent = "No public repositories found.";
  }
}

sortSelect.addEventListener("change", renderRepositories);
