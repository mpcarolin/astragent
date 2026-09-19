## Goal
* Goal: build a 3d visualization of the solar system including the sun, planets, and asteroids pulled from a real dataset
* Look at the research/ folder for how to pull data from real datasets. I believe we can do this one single time (it should be embeddedi na package.json script command) from the nasa api. We can transform that data if it's exxcessive, but something needs to be embedded in the web app which will read from it.
* We must use threejs for the visualization. Each planet should have a standard single color texture initially, and reflect light from the single light source: the sun. The sun can be a "basic" material -- no reflection because we are embedding a POINT light source in the center of it.
* There should be a deterministic, functional simulator module that is completely decoupled from threejs or any presentational concerns. It's only concern: receive a single datetime string (or number), output the coordinates of each object we are tracking in space.
    * This should use kepler's equations for realistic orbits
        * We need unit tests that validate this against authoritative real values
* No moons initially, just planets, but moons will be a stretch goal coming later
* General conventions:
    * single function per file
    * NO CODE COMMENTS AT ALL -- I will handle that
    * functional programming paradigm; avoid OO unless it's idiomatically contradicting threejs (and if so tell me)
* A very important detail: I will be writing many parts of this myself, because a huge priority here for me is **learning** threejs
* Stretch goal:
    * We also want this to be agentic
    * Should be able to run in a docker compose cluster both this app and also an ollama model for testing
    * Agentic features:
        * A single prompt bar embedded in the app so user can ask whatever they want
        * Agent should take that prompt and have a library of tools available to it for CONTROLLING the threejs view. Changing position of camera, angle, etc. 
            * Other tools: HIGHLIGHTING objects like asteroids or planets, and bringing up an annotation or popover for a given obejct with arbitrary text to answer the question the gave
        * Very important that the text answer is GROUNDED in real data, ideally data in the datasets or by the simulator. We cannot tolerate hallucinations or mistakes
        * Also critical: the delay between submitting the question, and seeing camera changes should be MINIMIZED. The time it takes to get the text answer can take longer and just show loading UI
            * Honestly i feel this should be doable.
        * All agentic code should be completely isolated from threejs. The only seam is the tool calls, which can overlap a bit.
        * I'm also open to using chrome's prompt api if it's sufficient here, that would be better, but i worry about general answers
        * Probably we need the agent to be able to do web research, or just have some really solid astronomical database to get grounding from. This likely needs its own research.
        * We probably need two different modes, gating by environment variable or some other ocnfig:
            * Full AI mode: uses a real llm via a backend express api, TS. Can both control threejs and ALSO answer very open ended questions.
            * Limited AI mode: uses chrome's prompt API only. All the AI can do is limited. We'll need to experiment to see HOW limited. But it might be limited to just threejs control and displaying static descrptions of objects, but no general answering of open ended questions.  
* Other stretch goals:
    * Show moons
    * Configuration Panel
        * User should be able to drag a slider with a 100 year range to see the objects in that range of time -- may needs to be debounced or throttled
        * user can specify a date in input
        * user can specify a time RATE of speed (like 2x, 10x, 100x) to see objects move in real time
        * I prefer these options to be done in plain html/css/js unless threejs is the better options
        * MAYBE hide/show certain kinds of objects (planets,moons,asteroids,etc)
    * Highlighting orbital trajectories
* During brainstorming I need to be closely involved in all architectural decisions.

## Phases
* i want to race to the point where we can just see planets orbiting the sun. All running LOCALLY. That's phase 1.
* Phase 2: deployment of static web app to be reachable under my mpcarolin.dev site
* Phase 3: limited ai mode implementation. Includes deployment, but should check for chrome -- if not present, no AI feature at all.
* Phase 4: Full AI mode (this will not be deployed)
* Phase 5: is all other non-agentic features (which will be deployed)
* Phase 6: Work with non-chrome local models that are optionally downloaded to support firefox and safari
