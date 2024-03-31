# BakaChain

![Uploading image.png…]()


We built a fully-specced 6-deck Baccarat game on Astar zkEVM to show how we can leverage state-of-the-art rollup technology to create transparent, verifiable and unruggable games on the blockchain!


The Baccarat contract is written in pure Solidity, and only costs ~110k gas to execute a round of Baccarat. That makes it insanely cheap for users to play (or for operators to sponsor). This is possible through our (mis)use of cryptographic algorithms that allows us to shuffle cards without touching storage slots. No need for fancy ZK here! ;)

The contract also keeps track of user wagers such that the operator cannot withdraw anything that isn't part of the operator's own balance or profits. Unruggable!

On our frontend, we create temporary session wallets that users deposit funds into. They only deposit the amount that they want to play with. Doing this allows us to programmatically submit bets without having to further prompt the user to sign transactions; thus giving users a really smooooooth experience, just like offchain apps.
