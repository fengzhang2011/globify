<script lang="ts">
  import { onMount } from "svelte";

  let activeSection = "rewards";

  onMount(() => {
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll("nav a");

    const onScroll = () => {
      let scrollPos = window.scrollY + 120;
      sections.forEach((item) => {
        const section = item as HTMLElement;
        if (
          section.offsetTop <= scrollPos &&
          section.offsetTop + section.offsetHeight > scrollPos
        ) {
          activeSection = section.id;
        }
      });
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  });

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };
</script>

<style>
  :global(body) {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    background-color: #fafafa;
    margin: 0;
    color: #222;
    line-height: 1.6;
  }

  header {
    text-align: center;
    padding: 80px 20px 100px;
  }

  header h1 {
    font-size: 2em;
    font-weight: bold;
    margin-bottom: 0.3em;
  }

  header p {
    font-size: 1.5em;
    max-width: 800px;
    margin: 0 auto 1.5em;
  }

  .cta a {
    background: #fff;
    color: #00796b;
    text-decoration: none;
    padding: 15px 40px;
    font-size: 1.2em;
    border-radius: 8px;
    font-weight: bold;
    transition: 0.3s;
  }

  .cta a:hover {
    background: #00796b;
    color: #fff;
  }

  .hero-image {
    width: 100%;
    max-width: 700px;
    height: 380px;
    background-color: rgba(255, 255, 255, 0.2);
    margin: 30px auto 0;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2em;
    color: rgba(255, 255, 255, 0.8);
  }

  nav {
    background: white;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  }

  nav ul {
    list-style: none;
    display: flex;
    justify-content: center;
    margin: 0;
    padding: 10px 0;
  }

  nav li {
    margin: 0 20px;
  }

  nav a {
    text-decoration: none;
    color: #00796b;
    font-weight: bold;
    font-size: 1em;
    transition: color 0.3s;
  }

  nav a.active {
    color: #00bfa5;
    border-bottom: 2px solid #00bfa5;
    padding-bottom: 4px;
  }

  section {
    max-width: 900px;
    margin: 60px auto;
    padding: 0 20px;
  }

  h2 {
    color: #00796b;
    border-bottom: 2px solid #00bfa5;
    padding-bottom: 10px;
  }

  .problem,
  .solution {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    padding: 30px;
    margin-bottom: 40px;
  }

  .image-placeholder {
    width: 100%;
    height: 300px;
    background-color: #e0e0e0;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 1.2em;
    margin: 20px 0;
  }

  .reward-tier {
    background: #f5f5f5;
    padding: 20px;
    border-radius: 10px;
    margin: 20px 0;
    border-left: 5px solid #00bfa5;
  }

  .cta {
    text-align: center;
    margin-top: 40px;
  }

  .cta a {
    background: #00bfa5;
    color: white;
    text-decoration: none;
    padding: 15px 40px;
    font-size: 1.2em;
    border-radius: 8px;
    font-weight: bold;
    transition: background 0.3s;
  }

  .cta a:hover {
    background: #00997f;
  }

  footer {
    text-align: center;
    padding: 30px;
    font-size: 0.9em;
    color: #555;
    background: #f2f2f2;
  }
</style>

<header>
  <h1>Friglance CleanTag | Know Dishwasher Status at a Glance</h1>
  <p>
    The world’s smartest dishwasher clean/dirty tag — automatically detects when
    your dishes are washed. No manual work, no guesswork.
  </p>
  <div style="display: flex">
    <div class="hero-image">
      <video src="/clean_dirty_tag_demo_video.mp4" controls>
        <track kind="captions">
      </video>
    </div>
    <div style="display: flex; flex-direction: column">
      <div style="height: 10px; width: 300px; background: green; margin-bottom: 20px"></div>
      <div style="display: flex; flex-direction: column; align-items: flex-start">
      <div style="color: green; font-size: 2.5em; font-weight: bold">CA$ 0</div>
      <div style="color: #666; font-size: 1.2em; margin-bottom: 20px">pledged of CA$ 2,000 goal</div>
      <div style="color: #666; font-size: 2.5em; font-weight: bold">0</div>
      <div style="color: #666; font-size: 1.2em; margin-bottom: 20px">backers</div>
      <div style="color: #666; font-size: 2.5em; font-weight: bold">30</div>
      <div style="color: #666; font-size: 1.2em">days to go</div>
    </div>
      <div class="cta">
        <a href="#rewards" on:click={() => scrollToSection("rewards")}>Back This Project</a>
      </div>
  </div>
  </div>
</header>

<nav>
  <ul>
    <li>
      <a
        href="#rewards"
        class:active={activeSection === "rewards"}
        on:click|preventDefault={() => scrollToSection("rewards")}
        >Rewards</a
      >
    </li>
    <li>
      <a
        href="#features"
        class:active={activeSection === "features"}
        on:click|preventDefault={() => scrollToSection("features")}
        >Features</a
      >
    </li>
    <li>
      <a
        href="#faq"
        class:active={activeSection === "faq"}
        on:click|preventDefault={() => scrollToSection("faq")}
        >FAQ</a
      >
    </li>
    <li>
      <a
        href="#story"
        class:active={activeSection === "story"}
        on:click|preventDefault={() => scrollToSection("story")}
        >Story</a
      >
    </li>
  </ul>
</nav>


<section id="problem" class="problem">
  <h2>The Daily Confusion</h2>
  <p>
    You walk into the kitchen and wonder — <strong>“Are these dishes clean or
    dirty?”</strong> You open the dishwasher, stare at the dishes, and try to
    remember. Did someone run it last night? Maybe not. The guessing leads to
    frustration, re-washing, wasted water, and wasted time — every single day.
  </p>
  <div class="image-placeholder">Photo: Family confused by dishwasher</div>
</section>

<section id="features" class="solution">
  <h2>The Smart Solution: Friglance CleanTag</h2>
  <p>
    Friglance CleanTag ends the guessing game forever. It’s a sleek,
    stainless-steel tag with smart sensors that
    <strong>detect when the wash cycle finishes</strong> — automatically
    switching its e-paper display from <strong>DIRTY → CLEAN</strong>. No need
    to press buttons or rely on memory — CleanTag knows when your dishes are
    done.
  </p>
  <div class="image-placeholder">
    Photo: CleanTag on dishwasher switching to CLEAN
  </div>
  <p>
    Runs for months on a small battery. Designed to blend beautifully with your
    modern kitchen. Just attach it magnetically — and let it think for you.
  </p>
</section>

<section id="rewards">
  <h2>Rewards</h2>
  <div class="reward-tier">
    <h3>💧 Early Bird – 1 CleanTag ($19)</h3>
    <p>
      Get one Friglance CleanTag at the special early price (MSRP $29). Includes
      battery and magnet mount.
    </p>
  </div>
  <div class="reward-tier">
    <h3>✨ Family Pack – 2 CleanTags ($35)</h3>
    <p>
      Perfect for households with multiple dishwashers or as a thoughtful gift
      for a friend.
    </p>
  </div>
  <div class="reward-tier">
    <h3>🎁 Gift Pack – 4 CleanTags ($64)</h3>
    <p>
      Share smart simplicity — ideal for families, friends, or neighbors.
    </p>
  </div>
  <div class="reward-tier">
    <h3>🌎 Distributor Pack – 20 CleanTags ($260)</h3>
    <p>
      For retail or influencer partners. Includes early shipment and promotional
      support.
    </p>
  </div>
  <div class="cta">
    <a href="#faq" on:click={() => scrollToSection("faq")}>Support Friglance CleanTag</a>
  </div>
</section>

<section id="faq">
  <h2>FAQ</h2>
  <p><strong>Q: How long does the battery last?</strong><br>
  A: One standard coin battery lasts 6–9 months of regular use.</p>
  <p><strong>Q: Does it work on all dishwashers?</strong><br>
  A: Yes. It uses a universal magnetic mount and smart sensing — no WiFi or app needed.</p>
  <p><strong>Q: Is it waterproof?</strong><br>
  A: Absolutely. The stainless steel and sealed electronics are splash resistant.</p>
  <p><strong>Q: Can I replace the battery?</strong><br>
  A: Yes. It uses a standard CR2032 coin cell, easily replaceable in seconds.</p>
</section>

<section id="story">
  <h2>Our Story</h2>
  <p>
    We’re a small team of designers and engineers who love solving simple but
    universal problems. The “clean or dirty?” dishwasher debate happened daily
    in our homes — so we built a tag that solves it intelligently. After 12
    prototypes, we found the perfect combination: sensor-driven logic, an
    ultra-efficient e-paper display, and elegant stainless steel. Now, with your
    help, we’re ready to bring CleanTag into every modern kitchen.
  </p>
  <div class="image-placeholder">Photo: Team testing prototypes</div>
  <div class="cta">
    <a href="#rewards" on:click={() => scrollToSection("rewards")}>Back This Project Now</a>
  </div>
</section>

<footer>
  <p>Friglance © 2025 | Designed for smarter, calmer homes</p>
</footer>
