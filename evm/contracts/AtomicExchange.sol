// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AtomicExchange {
    enum ListingState {
        Open,
        Cancelled,
        Sold
    }
    struct Listing {
        address seller;
        uint256 priceWei;
        ListingState state;
    } 
    uint256 public nextListingID;
    mapping(uint256 => Listing) public listings;

    event ListingCreated(uint256 indexed id, address indexed seller, uint256 priceWei);
    event ListingCancelled(uint256 indexed id);
    event ListingSold(uint256 indexed id, address indexed buyer, uint256 priceWei);

    function createListing(uint256 priceWei) external returns (uint256 id) {
        require(priceWei > 0, "Price must be > 0");
        id = nextListingID++;
        listings[id] = Listing({
            seller: msg.sender,
            priceWei: priceWei,
            state: ListingState.Open
        });
        emit ListingCreated(id, msg.sender, priceWei);   
    }
    function cancelListing(uint256 id) external {
        Listing storage listing = listings[id];
        require(listing.state == ListingState.Open, "Not open");
        require(listing.seller == msg.sender, "Not seller");
        listing.state = ListingState.Cancelled;
        emit ListingCancelled(id);
    }
    function buyLisitng(uint256 id) external payable {
        Listing storage listing = listings[id];
        require(listing.state == ListingState.Open, "Not open");
        require(msg.value == listing.priceWei, "Wrong payment");
        listing.state = ListingState.Sold;
        (bool ok, ) = payable(listing.seller).call{value: msg.value}("");
        require(ok, "Payment failed");
        emit ListingSold(id, msg.sender, msg.value);
    }
}
