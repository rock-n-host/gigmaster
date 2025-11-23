#!/bin/bash

echo "
                                                                                                 
      # ###                                                                                      
    /  /###  /   #                                                                               
   /  /  ###/   ###                                                      #                       
  /  ##   ##     #                                                      ##                       
 /  ###                                                                 ##                       
##   ##        ###       /###    ### /### /###     /###      /###     ######## /##  ###  /###    
##   ##   ###   ###     /  ###  / ##/ ###/ /##  / / ###  /  / #### / ######## / ###  ###/ #### / 
##   ##  /###  / ##    /    ###/   ##  ###/ ###/ /   ###/  ##  ###/     ##   /   ###  ##   ###/  
##   ## /  ###/  ##   ##     ##    ##   ##   ## ##    ##  ####          ##  ##    ### ##         
##   ##/    ##   ##   ##     ##    ##   ##   ## ##    ##    ###         ##  ########  ##         
 ##  ##     #    ##   ##     ##    ##   ##   ## ##    ##      ###       ##  #######   ##         
  ## #      /    ##   ##     ##    ##   ##   ## ##    ##        ###     ##  ##        ##         
   ###     /     ##   ##     ##    ##   ##   ## ##    /#   /###  ##     ##  ####    / ##         
    ######/      ### / ########    ###  ###  ### ####/ ## / #### /      ##   ######/  ###        
      ###         ##/    ### ###    ###  ###  ### ###   ##   ###/        ##   #####    ###       
                              ###                                                                
                        ####   ###                                                               
                      /######  /#                                                                
                     /     ###/                                                                  
"

echo "🎸 Installing Gigmaster..."

# 1. Create Directories
mkdir -p lyrics/properties
if [ ! -f lyrics/demo-Song.txt ]; then
    echo "Creating demo song..."
    echo "
[Verse]
I’m typing out my code tonight,
Blue and green lines looking right,
Commit the change, I feel the buzz—
Time to push it to the Hub!

[Chorus]
Oh GitHub, GitHub,
Where all my branches grow,
Merge my dreams together
In a perfect workflow.
Oh GitHub, GitHub,
You keep my bugs at bay—
I push, you pull, we sync,
And ship the code away!
    " > lyrics/demo-Song.txt
    echo "title: Wonderwall" > lyrics/properties/demo-Song.yaml
    echo "artist: Oasis" >> lyrics/properties/demo-Song.yaml
    echo "bpm: 87" >> lyrics/properties/demo-Song.yaml
fi

# 2. Install Backend
echo "📦 Installing Backend Dependencies..."
cd ../backend
npm install

# 3. Install & Build Frontend
echo "🎨 Installing & Building Frontend..."
cd ../frontend
npm install
npm run build

# 4. Return to root
cd ..

echo "✅ Installation Complete!"
echo "🚀 to start: node backend/src/index.js"
