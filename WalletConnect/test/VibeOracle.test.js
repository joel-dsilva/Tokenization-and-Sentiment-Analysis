const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VibeOracle", function () {
    let vibeOracle;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        const VibeOracleFactory = await ethers.getContractFactory("VibeOracle");
        vibeOracle = await VibeOracleFactory.deploy();
        await vibeOracle.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await vibeOracle.owner()).to.equal(owner.address);
        });

        it("Should start with zero sentiments", async function () {
            expect(await vibeOracle.getSentimentCount()).to.equal(0);
        });
    });

    describe("Submit Sentiment", function () {
        it("Should allow submitting sentiment data", async function () {
            await expect(
                vibeOracle.connect(addr1).submitSentiment(
                    "testuser",
                    "This is a test message",
                    75
                )
            ).to.emit(vibeOracle, "SentimentSubmitted");

            expect(await vibeOracle.getSentimentCount()).to.equal(1);
        });

        it("Should reject sentiment scores outside -100 to 100", async function () {
            await expect(
                vibeOracle.connect(addr1).submitSentiment(
                    "testuser",
                    "Test message",
                    150
                )
            ).to.be.revertedWith("VibeOracle: sentiment score must be between -100 and 100");

            await expect(
                vibeOracle.connect(addr1).submitSentiment(
                    "testuser",
                    "Test message",
                    -150
                )
            ).to.be.revertedWith("VibeOracle: sentiment score must be between -100 and 100");
        });

        it("Should reject empty text", async function () {
            await expect(
                vibeOracle.connect(addr1).submitSentiment(
                    "testuser",
                    "",
                    50
                )
            ).to.be.revertedWith("VibeOracle: text cannot be empty");
        });

        it("Should store sentiment data correctly", async function () {
            await vibeOracle.connect(addr1).submitSentiment(
                "testuser",
                "This is a positive message",
                85
            );

            const sentiment = await vibeOracle.getSentiment(0);
            expect(sentiment.username).to.equal("testuser");
            expect(sentiment.text).to.equal("This is a positive message");
            expect(sentiment.sentimentScore).to.equal(85);
            expect(sentiment.submittedBy).to.equal(addr1.address);
        });
    });

    describe("Get Sentiment", function () {
        it("Should retrieve sentiment data by ID", async function () {
            await vibeOracle.connect(addr1).submitSentiment(
                "user1",
                "First message",
                50
            );

            const sentiment = await vibeOracle.getSentiment(0);
            expect(sentiment.username).to.equal("user1");
            expect(sentiment.text).to.equal("First message");
            expect(sentiment.sentimentScore).to.equal(50);
        });

        it("Should reject invalid sentiment ID", async function () {
            await expect(
                vibeOracle.getSentiment(0)
            ).to.be.revertedWith("VibeOracle: sentiment ID does not exist");
        });
    });

    describe("Ownership", function () {
        it("Should allow owner to transfer ownership", async function () {
            await vibeOracle.transferOwnership(addr1.address);
            expect(await vibeOracle.owner()).to.equal(addr1.address);
        });

        it("Should emit OwnershipTransferred event", async function () {
            await expect(
                vibeOracle.transferOwnership(addr1.address)
            ).to.emit(vibeOracle, "OwnershipTransferred")
                .withArgs(owner.address, addr1.address);
        });

        it("Should reject zero address as new owner", async function () {
            await expect(
                vibeOracle.transferOwnership(ethers.ZeroAddress)
            ).to.be.revertedWith("VibeOracle: new owner is the zero address");
        });

        it("Should reject non-owner from transferring ownership", async function () {
            await expect(
                vibeOracle.connect(addr1).transferOwnership(addr2.address)
            ).to.be.revertedWith("VibeOracle: caller is not the owner");
        });
    });
});
