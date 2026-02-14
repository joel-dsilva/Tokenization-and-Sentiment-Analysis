// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title VibeOracle
 * @dev Oracle contract for storing and retrieving sentiment analysis data
 */
contract VibeOracle {
    // Struct to store sentiment data
    struct SentimentData {
        string username;
        string text;
        int256 sentimentScore; // -100 to 100 (negative = bad, positive = good)
        uint256 timestamp;
        address submittedBy;
    }

    // Mapping to store sentiment data by ID
    mapping(uint256 => SentimentData) public sentiments;
    
    // Counter for sentiment IDs
    uint256 private sentimentCounter;
    
    // Owner of the contract
    address public owner;
    
    // Current vibe score (0-100) for frontend compatibility
    uint8 public vibeScore;
    
    // Rolling average for "buy the dip" logic
    uint8 private rollingAverage;
    uint256 private scoreSum;
    uint256 private scoreCount;
    uint256 private constant MAX_HISTORY = 100;
    uint8 private constant FUD_THRESHOLD = 20;
    
    // Events
    event SentimentSubmitted(
        uint256 indexed id,
        string username,
        string text,
        int256 sentimentScore,
        uint256 timestamp,
        address submittedBy
    );
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    event AutomatedBuyExecuted(
        uint8 indexed oldScore,
        uint8 indexed newScore,
        uint256 timestamp,
        address executedBy
    );
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "VibeOracle: caller is not the owner");
        _;
    }
    
    /**
     * @dev Constructor sets the deployer as the owner
     */
    constructor() {
        owner = msg.sender;
        sentimentCounter = 0;
        vibeScore = 50; // Start at neutral
        rollingAverage = 50;
    }
    
    /**
     * @dev Submit sentiment data to the oracle
     * @param _username Username associated with the sentiment
     * @param _text Original text that was analyzed
     * @param _sentimentScore Sentiment score from -100 to 100
     */
    function submitSentiment(
        string memory _username,
        string memory _text,
        int256 _sentimentScore
    ) public {
        require(_sentimentScore >= -100 && _sentimentScore <= 100, "VibeOracle: sentiment score must be between -100 and 100");
        require(bytes(_text).length > 0, "VibeOracle: text cannot be empty");
        
        uint256 id = sentimentCounter;
        sentiments[id] = SentimentData({
            username: _username,
            text: _text,
            sentimentScore: _sentimentScore,
            timestamp: block.timestamp,
            submittedBy: msg.sender
        });
        
        sentimentCounter++;
        
        // Convert -100 to 100 range to 0-100 range for vibeScore
        int256 normalized = (_sentimentScore + 100) / 2;
        require(normalized >= 0 && normalized <= 100, "VibeOracle: normalized score out of range");
        updateVibeScore(uint8(uint256(normalized)));
        
        emit SentimentSubmitted(
            id,
            _username,
            _text,
            _sentimentScore,
            block.timestamp,
            msg.sender
        );
    }
    
    /**
     * @dev Get sentiment data by ID
     * @param _id The ID of the sentiment data
     * @return SentimentData struct containing all sentiment information
     */
    function getSentiment(uint256 _id) public view returns (SentimentData memory) {
        require(_id < sentimentCounter, "VibeOracle: sentiment ID does not exist");
        return sentiments[_id];
    }
    
    /**
     * @dev Get the total number of sentiments stored
     * @return Total count of sentiments
     */
    function getSentimentCount() public view returns (uint256) {
        return sentimentCounter;
    }
    
    /**
     * @dev Update vibe score (for frontend compatibility)
     * @param _newScore New vibe score (0-100)
     */
    function updateVibeScore(uint8 _newScore) public {
        require(_newScore <= 100, "VibeOracle: score must be between 0 and 100");
        
        uint8 oldScore = vibeScore;
        vibeScore = _newScore;
        
        // Update rolling average
        if (scoreCount < MAX_HISTORY) {
            scoreCount++;
            scoreSum = scoreSum + uint256(_newScore);
        } else {
            // Maintain rolling window by approximating removal of oldest
            scoreSum = scoreSum - uint256(rollingAverage) + uint256(_newScore);
        }
        rollingAverage = uint8(scoreSum / scoreCount);
        
        // Check for "buy the dip" trigger
        executeTradeIfFUD();
    }
    
    /**
     * @dev Execute trade if FUD threshold is reached
     */
    function executeTradeIfFUD() private {
        if (vibeScore <= FUD_THRESHOLD && rollingAverage <= FUD_THRESHOLD) {
            emit AutomatedBuyExecuted(
                vibeScore,
                vibeScore,
                block.timestamp,
                msg.sender
            );
        }
    }
    
    /**
     * @dev Transfer ownership of the contract
     * @param _newOwner Address of the new owner
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "VibeOracle: new owner is the zero address");
        address oldOwner = owner;
        owner = _newOwner;
        emit OwnershipTransferred(oldOwner, _newOwner);
    }
}
