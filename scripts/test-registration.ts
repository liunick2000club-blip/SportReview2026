import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function testRegistrationFlow() {
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = "testPassword123";
  const testName = "Test User";

  console.log(`--- Starting Registration Test for: ${testEmail} ---`);

  // 1. Simulate Registration API Logic
  console.log("1. Simulating Registration API...");
  const hashedPassword = await bcrypt.hash(testPassword, 10);
  
  try {
    const newUser = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        name: testName,
      }
    });
    console.log("✅ User created successfully in DB.");
    
    // 2. Verify Database Content
    console.log("2. Verifying DB record...");
    const dbUser = await prisma.user.findUnique({ where: { email: testEmail } });
    if (dbUser && dbUser.name === testName) {
      console.log("✅ DB record matches input.");
    } else {
      throw new Error("❌ DB record mismatch!");
    }

    // 3. Simulate Login (NextAuth Credentials)
    console.log("3. Simulating Login Authorization...");
    const isMatch = await bcrypt.compare(testPassword, dbUser.password);
    if (isMatch) {
      console.log("✅ Password verification successful.");
    } else {
      throw new Error("❌ Password verification failed!");
    }

    // 4. Test Data Isolation
    console.log("4. Testing Data Isolation (should have 0 activities)...");
    const activityCount = await prisma.activity.count({ where: { userId: dbUser.id } });
    if (activityCount === 0) {
      console.log("✅ User has 0 activities as expected.");
    } else {
      throw new Error("❌ Data isolation fail: New user has activities!");
    }

    // Cleanup
    console.log("5. Cleaning up test user...");
    await prisma.user.delete({ where: { id: dbUser.id } });
    console.log("✅ Cleanup complete.");
    
    console.log("\n--- ALL REGISTRATION TESTS PASSED! 🚀 ---");

  } catch (error) {
    console.error("\n--- TEST FAILED! ❌ ---");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testRegistrationFlow();
