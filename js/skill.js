document.addEventListener("DOMContentLoaded", () => {

  const skillNodes = document.querySelectorAll(".skill-node");
  const linesSVG = document.getElementById("lines");
  const descriptionPanel = document.getElementById("descriptionPanel");
  const togglePanelBtn = document.getElementById("togglePanelBtn");
  const resetBtn = document.getElementById("resetBtn");
  const exportBtn = document.getElementById("exportBtn");
  const importBtn = document.getElementById("importBtn");
  const importFile = document.getElementById("importFile");

  /* -------------------- STATE FUNCTIONS -------------------- */

  function loadSkillState() {
    const savedState = JSON.parse(localStorage.getItem("skillTreeState")) || {};
    skillNodes.forEach(node => {
      node.dataset.unlocked = savedState[node.dataset.id] ? "true" : "false";
    });
  }

  function saveSkillState() {
    const state = {};
    skillNodes.forEach(node => {
      state[node.dataset.id] = node.dataset.unlocked === "true";
    });
    localStorage.setItem("skillTreeState", JSON.stringify(state));
  }

  function loadRequirementsState(skillId) {
    const savedReqs = JSON.parse(localStorage.getItem("skillRequirements")) || {};
    return savedReqs[skillId] || [];
  }

  function saveRequirementsState(skillId, checkedIndices) {
    const savedReqs = JSON.parse(localStorage.getItem("skillRequirements")) || {};
    savedReqs[skillId] = checkedIndices;
    localStorage.setItem("skillRequirements", JSON.stringify(savedReqs));
  }

  /* -------------------- PANEL TOGGLE -------------------- */

  togglePanelBtn.addEventListener("click", () => {
    descriptionPanel.classList.toggle("hidden");
    document.body.classList.toggle("panel-hidden", !descriptionPanel.classList.contains("hidden"));
  });

  /* -------------------- SKILL NODE CLICK & INFO -------------------- */

  skillNodes.forEach(node => {

    const button = node.querySelector(".skill-button");

    // Info button inside skill
    button.addEventListener("click", e => {
      e.stopPropagation();

      const skillName = node.querySelector(".skill-name").textContent;
      const description = node.dataset.description || "";
      const requirements = node.dataset.requirements ? node.dataset.requirements.split(",") : [];

      let reqHtml = "";
      if (requirements.length) {
        reqHtml = "<h4>Requirements:</h4>";
        const savedChecked = loadRequirementsState(node.dataset.id);
        requirements.forEach((req, i) => {
          const checked = savedChecked.includes(i) ? "checked" : "";
          reqHtml += `<label><input type="checkbox" class="req-checkbox" data-req-index="${i}" ${checked}> ${req}</label><br>`;
        });
      }

      reqHtml += `<button id="unlockSkillBtn">Unlock Skill</button>`;

      descriptionPanel.classList.remove("hidden");
      descriptionPanel.innerHTML = `<h2>${skillName}</h2>
                                    <p>${description}</p>
                                    ${reqHtml}`;

      // Checkbox change handler
      descriptionPanel.querySelectorAll(".req-checkbox").forEach(cb => {
        cb.addEventListener("change", () => {
          const checkedIndices = Array.from(descriptionPanel.querySelectorAll(".req-checkbox"))
                                      .map((c, idx) => c.checked ? idx : -1)
                                      .filter(idx => idx !== -1);
          saveRequirementsState(node.dataset.id, checkedIndices);
        });
      });

      // Unlock skill button handler
      const unlockBtn = document.getElementById("unlockSkillBtn");
      unlockBtn.addEventListener("click", () => {
        const allChecked = Array.from(descriptionPanel.querySelectorAll(".req-checkbox"))
                                .every(cb => cb.checked);
        const prereqId = node.dataset.prereq;
        const prereqUnlocked = !prereqId || document.querySelector(`[data-id="${prereqId}"]`).dataset.unlocked === "true";

        if (allChecked && prereqUnlocked) {
          node.dataset.unlocked = "true";
          saveSkillState();
          drawLines();
          alert(`${skillName} unlocked!`);
        } else {
          alert("You must complete all requirements and unlock prerequisite skills first.");
        }
      });
    });

    // Direct click toggle
    node.addEventListener("click", () => {
      const unlocked = node.dataset.unlocked === "true";
      const prereqId = node.dataset.prereq;
      const requirements = node.dataset.requirements ? node.dataset.requirements.split(",") : [];
      const allRequirementsMet = requirements.length === 0;
      const prereqUnlocked = !prereqId || document.querySelector(`[data-id="${prereqId}"]`).dataset.unlocked === "true";

      if (!unlocked) {
        if (allRequirementsMet && prereqUnlocked) {
          node.dataset.unlocked = "true";
          saveSkillState();
          drawLines();
        } else {
          alert("You must unlock this skill from the info panel if it has requirements or the prerequisite is locked.");
        }
      } else {
        const hasUnlockedChildren = Array.from(skillNodes)
                                        .some(child => child.dataset.prereq === node.dataset.id && child.dataset.unlocked === "true");
        if (hasUnlockedChildren) {
          alert("You cannot lock this skill because it has unlocked dependent skills!");
        } else {
          node.dataset.unlocked = "false";
          saveSkillState();
          drawLines();
        }
      }
    });

  });

  /* -------------------- DRAW LINES -------------------- */

  function drawLines() {
    linesSVG.innerHTML = "";
    skillNodes.forEach(node => {
      const prereqId = node.dataset.prereq;
      if (prereqId) {
        const prereqNode = document.querySelector(`[data-id="${prereqId}"]`);
        const rect1 = prereqNode.getBoundingClientRect();
        const rect2 = node.getBoundingClientRect();
        const svgRect = linesSVG.getBoundingClientRect();

        const x1 = rect1.left + rect1.width/2 - svgRect.left;
        const y1 = rect1.top + rect1.height/2 - svgRect.top;
        const x2 = rect2.left + rect2.width/2 - svgRect.left;
        const y2 = rect2.top + rect2.height/2 - svgRect.top;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);

        if (node.dataset.unlocked === "true" && prereqNode.dataset.unlocked === "true") {
          line.classList.add("unlocked");
        }

        linesSVG.appendChild(line);
      }
    });
  }

  /* -------------------- RESET BUTTON -------------------- */

  resetBtn.addEventListener("click", () => {
    if (!confirm("Are you sure you want to reset the skill tree?")) return;

    skillNodes.forEach(node => node.dataset.unlocked = "false");

    localStorage.removeItem("skillTreeState");
    localStorage.removeItem("skillRequirements");

    descriptionPanel.querySelectorAll(".req-checkbox").forEach(cb => cb.checked = false);

    drawLines();
  });

  /* -------------------- EXPORT BUTTON -------------------- */

  exportBtn.addEventListener("click", () => {
    const skillState = JSON.parse(localStorage.getItem("skillTreeState")) || {};
    const reqState = JSON.parse(localStorage.getItem("skillRequirements")) || {};
    const exportData = { skills: skillState, requirements: reqState };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "skill_tree_backup.json");
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  });

  /* -------------------- IMPORT BUTTON -------------------- */

  importBtn.addEventListener("click", () => importFile.click());

  importFile.addEventListener("change", () => {
    const file = importFile.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const importData = JSON.parse(e.target.result);
        const skills = importData.skills || {};
        const requirements = importData.requirements || {};

        skillNodes.forEach(node => {
          node.dataset.unlocked = skills[node.dataset.id] ? "true" : "false";
        });

        localStorage.setItem("skillTreeState", JSON.stringify(skills));
        localStorage.setItem("skillRequirements", JSON.stringify(requirements));

        drawLines();
        alert("Skill tree successfully imported!");
      } catch(err) {
        alert("Failed to import skill tree: invalid file.");
        console.error(err);
      }
    };
    reader.readAsText(file);
  });

  /* -------------------- INITIAL SETUP -------------------- */

  loadSkillState();
  drawLines();
  window.addEventListener("resize", drawLines);

});
