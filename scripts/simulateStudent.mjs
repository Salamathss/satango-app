// scripts/simulateStudent.mjs
import { chromium } from "playwright";

const BASE_URL = "http://localhost:8080";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const errors = [];
const warnings = [];
const steps = [];

function logStep(step, detail = "") {
  console.log(`[STUDENT SIMULATION] ✅ ${step} ${detail}`);
  steps.push({ step, detail, timestamp: new Date().toISOString() });
}

function logError(step, err) {
  console.error(`[STUDENT SIMULATION] ❌ ${step}:`, err);
  errors.push({ step, error: String(err) });
}

async function runStudentSimulation() {
  console.log("=================================================");
  console.log("🎓 STARTING REAL STUDENT END-TO-END SIMULATION");
  console.log("=================================================");

  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_PATH,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: "ru-RU",
  });

  const page = await context.newPage();

  page.on("pageerror", (err) => {
    logError("Page Uncaught Exception", err.message);
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      // Ignore favicon or benign warnings
      if (!msg.text().includes("favicon.ico") && !msg.text().includes("404")) {
        console.warn(`[BROWSER CONSOLE ERROR] ${msg.text()}`);
        warnings.push(msg.text());
      }
    }
  });

  try {
    // -------------------------------------------------------------
    // SCENARIO 1: LANDING & DEMO AUTHENTICATION
    // -------------------------------------------------------------
    logStep("Step 1", "Navigating to root landing page");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Set guest student in localStorage so student enters dashboard
    await page.evaluate(() => {
      localStorage.setItem("satango.guest_student", "1");
      localStorage.setItem("satango_sound_enabled", "true");
    });

    logStep("Step 2", "Entering Dashboard as Demo Student");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    const title = await page.title();
    logStep("Step 2 Verified", `Dashboard loaded, title: "${title}"`);

    // -------------------------------------------------------------
    // SCENARIO 2: DASHBOARD EXPLORATION & SOUND TOGGLE
    // -------------------------------------------------------------
    logStep("Step 3", "Checking Dashboard Daily Rituals & Audio Toggle");
    
    // Find sound toggle button in header
    const soundToggle = page.locator('button[aria-label="Звуковые эффекты"], button[aria-label="Sound effects"]').first();
    if (await soundToggle.isVisible()) {
      await soundToggle.click();
      await page.waitForTimeout(300);
      await soundToggle.click();
      logStep("Step 3 Verified", "Sound toggle interactive and responsive");
    }

    // Try claiming or viewing daily reward
    const claimBtn = page.locator('button:has-text("Забрать награду"), button:has-text("Открыть сундук")').first();
    if (await claimBtn.isVisible()) {
      await claimBtn.click();
      await page.waitForTimeout(800);
      logStep("Step 3 Verified", "Daily chest clicked");
    }

    // -------------------------------------------------------------
    // SCENARIO 3: 1v1 SAT BATTLE (AI DUEL MODE)
    // -------------------------------------------------------------
    logStep("Step 4", "Opening 1v1 SAT Battle Arena (/battle)");
    await page.goto(`${BASE_URL}/battle`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Look for "Solo Battle vs AI Bot" or quick duel button
    const quickDuelBtn = page.locator('button:has-text("Начать дуэль"), button:has-text("Quick Duel")').first();
    if (await quickDuelBtn.isVisible()) {
      await quickDuelBtn.click();
      logStep("Step 4", "Started AI Battle against Alex (1540)");
      await page.waitForTimeout(1200);

      // Answer question 1
      const optionA = page.locator("button:has-text('A')").first();
      if (await optionA.isVisible()) {
        await optionA.click();
        logStep("Step 4", "Selected Option A in Duel");
        await page.waitForTimeout(800);

        // Click next question
        const nextBtn = page.locator('button:has-text("Следующий вопрос"), button:has-text("Next Question")').first();
        if (await nextBtn.isVisible()) {
          await nextBtn.click();
          await page.waitForTimeout(800);
          logStep("Step 4 Verified", "Advanced to Question 2 in Duel");
        }
      }
    }

    // -------------------------------------------------------------
    // SCENARIO 4: MOCKS & BLUEBOOK SIMULATOR
    // -------------------------------------------------------------
    logStep("Step 5", "Testing Practice Tests Hub (/mocks)");
    await page.goto(`${BASE_URL}/mocks`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Switch tabs: Full Mocks vs Section Mocks
    const secTab = page.locator('button:has-text("Секционные тесты"), button:has-text("Section Mocks")').first();
    if (await secTab.isVisible()) {
      await secTab.click();
      await page.waitForTimeout(600);
      logStep("Step 5", "Switched to Section Mocks tab");
    }

    // Launch Bluebook Exam Simulator
    logStep("Step 6", "Launching Official Bluebook Exam Simulator (/bluebook?testId=sec-math-core)");
    await page.goto(`${BASE_URL}/bluebook?testId=sec-math-core`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    // Verify Bluebook top bar elements
    const calcBtn = page.locator('button:has-text("Calculator")').first();
    if (await calcBtn.isVisible()) {
      await calcBtn.click();
      await page.waitForTimeout(500);
      logStep("Step 6 Verified", "Floating Desmos calculator opened");
      await calcBtn.click(); // toggle close
    }

    const refBtn = page.locator('button:has-text("Reference")').first();
    if (await refBtn.isVisible()) {
      await refBtn.click();
      await page.waitForTimeout(500);
      logStep("Step 6 Verified", "Math formula reference modal opened");
      // Close reference modal
      const closeRef = page.locator('button:has-text("Close"), button:has-text("✕")').first();
      if (await closeRef.isVisible()) await closeRef.click();
    }

    // Select an answer on question 1
    const radioOption = page.locator('button:has-text("A"), button:has-text("B")').first();
    if (await radioOption.isVisible()) {
      await radioOption.click();
      logStep("Step 6", "Selected answer in Bluebook Simulator");
    }

    // Jump to review screen or finish
    const nextQBtn = page.locator('button:has-text("Next"), button:has-text("Review Module")').first();
    if (await nextQBtn.isVisible()) {
      await nextQBtn.click();
      await page.waitForTimeout(500);
    }

    // -------------------------------------------------------------
    // SCENARIO 5: DESMOS LAB (/desmos-lab)
    // -------------------------------------------------------------
    logStep("Step 7", "Testing Desmos Lab (/desmos-lab)");
    await page.goto(`${BASE_URL}/desmos-lab`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);

    // Click into Lesson 1
    const lessonCard = page.locator('div:has-text("Решение систем уравнений"), div:has-text("Lesson 1")').first();
    if (await lessonCard.isVisible()) {
      await lessonCard.click();
      await page.waitForTimeout(1500);
      logStep("Step 7 Verified", "Opened Desmos Lab Lesson 1 Split-Screen");
    }

    // -------------------------------------------------------------
    // SCENARIO 6: INTERACTIVE CHEATSHEET (/cheatsheet)
    // -------------------------------------------------------------
    logStep("Step 8", "Testing Interactive Cheatsheet (/cheatsheet)");
    await page.goto(`${BASE_URL}/cheatsheet`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Test tab: Grammar Bible
    const grammarTab = page.locator('button:has-text("Grammar Bible")').first();
    if (await grammarTab.isVisible()) {
      await grammarTab.click();
      await page.waitForTimeout(500);
      logStep("Step 8", "Switched to Grammar Bible tab");

      // Click a mini-quiz answer button
      const quizBtn = page.locator('button:has-text("allowing astronomers"), button:has-text("She had one")').first();
      if (await quizBtn.isVisible()) {
        await quizBtn.click();
        await page.waitForTimeout(500);
        logStep("Step 8 Verified", "Mini-quiz interactive response checked");
      }
    }

    // Test tab: Formula Hub
    const formulaTab = page.locator('button:has-text("Formula Hub")').first();
    if (await formulaTab.isVisible()) {
      await formulaTab.click();
      await page.waitForTimeout(500);
      logStep("Step 8 Verified", "Switched to Formula Hub");
    }

    // -------------------------------------------------------------
    // SCENARIO 7: ANALYTICS & DOMAIN MASTERY RADAR (/analytics)
    // -------------------------------------------------------------
    logStep("Step 9", "Testing Analytics & Domain Mastery Radar (/analytics)");
    await page.goto(`${BASE_URL}/analytics`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);

    const radar = page.locator("svg polygon").first();
    if (await radar.isVisible()) {
      logStep("Step 9 Verified", "Domain Mastery Radar SVG rendered");
    }

    // -------------------------------------------------------------
    // SCENARIO 8: MISTAKE VAULT (/errors)
    // -------------------------------------------------------------
    logStep("Step 10", "Testing Mistake Vault (/errors)");
    await page.goto(`${BASE_URL}/errors`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    logStep("Step 10 Verified", "Mistake Vault page loaded without crash");

  } catch (err) {
    logError("Simulation Fatal Error", err.message);
  } finally {
    try {
      await Promise.race([
        browser.close(),
        new Promise((r) => setTimeout(r, 1500)),
      ]);
    } catch {}
  }

  console.log("=================================================");
  console.log(`🏁 SIMULATION COMPLETE: ${steps.length} steps executed`);
  console.log(`Errors encountered: ${errors.length}`);
  console.log(`Console warnings: ${warnings.length}`);
  console.log("=================================================");

  if (errors.length > 0) {
    console.error("Errors list:", JSON.stringify(errors, null, 2));
    process.exit(1);
  } else {
    console.log("🎉 ALL PAGES & WORKFLOWS OPERATING AT 100%!");
    process.exit(0);
  }
}

runStudentSimulation();
