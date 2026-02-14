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
