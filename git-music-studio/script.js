// --- Sound Setup ---
// Get the audio elements from the HTML
const sounds = {
    kick: document.getElementById('kick-sound'),
    snare: document.getElementById('snare-sound'),
    hihat: document.getElementById('hihat-sound')
    // Add more sounds here if you like, remember to add them in index.html too
};

// --- Git Simulation Data Structure ---
// This is a simplified model! Real Git is much more complex with diffs, trees, etc.
// 'commits' stores snapshots of sequences, keyed by a simple commit ID.
// { commitId: ['sound1', 'sound2', ...], ... }
let commits = {};
// 'branches' maps branch names to the commitId they currently point to.
// 'main' is the default branch. null means no commits on this branch yet.
let branches = {
    'main': null
};
// 'currentBranch' tracks which branch the user is currently working on.
let currentBranch = 'main';
// 'currentSequence' holds the sequence of sounds being actively edited.
let currentSequence = [];
// Simple counter to generate unique commit IDs.
let commitCounter = 0;

// --- UI Elements ---
// Get references to the HTML elements we'll interact with
const sequenceDisplay = document.getElementById('current-sequence');
const historyDisplay = document.getElementById('history');
const branchSelect = document.getElementById('branch-select');
const mergeSelect = document.getElementById('merge-select');
const playButton = document.getElementById('play-btn');
const commitButton = document.getElementById('commit-btn');
const createBranchButton = document.getElementById('create-branch-btn');
const switchBranchButton = document.getElementById('switch-branch-btn');
const mergeButton = document.getElementById('merge-btn');
// Get all buttons within the sound-buttons div
const soundButtons = document.querySelectorAll('.sound-buttons button');

// --- Functions ---

// Updates the visual display of the current song sequence in the UI
function renderSequence() {
    sequenceDisplay.innerHTML = ''; // Clear current display
    if (currentSequence.length === 0) {
        sequenceDisplay.innerHTML = '<p class="text-gray-500">Add some sounds!</p>';
        return;
    }
    // Create a visual block for each sound in the sequence
    currentSequence.forEach(sound => {
        const soundBlock = document.createElement('span');
        soundBlock.classList.add('sound-block'); // Apply CSS class for styling
        soundBlock.textContent = sound; // Display the sound name
        sequenceDisplay.appendChild(soundBlock); // Add to the display area
    });
}

// Updates the history display area
function renderHistory() {
    historyDisplay.innerHTML = ''; // Clear current history display
    let historyText = 'History:\n';

    // Sort branches alphabetically for consistent display order
    const sortedBranchNames = Object.keys(branches).sort();

    // Sort commits chronologically based on our simple counter
    const sortedCommitIds = Object.keys(commits).sort((a, b) => parseInt(a.replace('c', '')) - parseInt(b.replace('c', '')));

    // Iterate through sorted commits to build the history text
    sortedCommitIds.forEach(commitId => {
        // Find which branches are currently pointing to this commit
        const pointingBranches = sortedBranchNames.filter(branchName => branches[branchName] === commitId);
        const branchPointers = pointingBranches.length > 0 ? ` (${pointingBranches.join(', ')})` : '';
         // Check if the current branch's HEAD is pointing to this commit
         const isHead = (branches[currentBranch] === commitId);
         const headPointer = isHead ? ' (HEAD)' : ''; // Indicate the commit the current branch points to (HEAD)

        // Add a line to the history text for this commit
        historyText += `- Commit ${commitId}${branchPointers}${headPointer}: [${commits[commitId].join(', ')}]\n`;
    });

    // If there are no commits yet, display an initial state message
    if (sortedCommitIds.length === 0) {
         historyText += `- Initial state (no commits yet on branch '${currentBranch}')\n`;
    }

    // Set the history display text
    historyDisplay.textContent = historyText;
}


// Updates the options in the branch selection dropdowns (switch and merge)
function renderBranchSelects() {
    branchSelect.innerHTML = ''; // Clear current options for switching
    mergeSelect.innerHTML = '<option value="">-- Select Branch --</option>'; // Clear current options for merging

    // Add each branch as an option
    Object.keys(branches).forEach(branchName => {
        const option = document.createElement('option');
        option.value = branchName;
        // Indicate the current branch in the switch dropdown
        option.textContent = branchName + (branchName === currentBranch ? ' (current)' : '');
        branchSelect.appendChild(option);

         // Add to merge select, but exclude the current branch itself
        if (branchName !== currentBranch) {
             const mergeOption = document.createElement('option');
             mergeOption.value = branchName;
             mergeOption.textContent = branchName;
             mergeSelect.appendChild(mergeOption);
        }
    });
    // Ensure the switch dropdown shows the currently active branch
    branchSelect.value = currentBranch;
}


// Adds a sound to the current sequence being edited
function addSound(soundName) {
    console.log(`Adding sound: ${soundName}`); // Log for debugging
    currentSequence.push(soundName); // Add the sound name to the array
    renderSequence(); // Update the visual display
}

// Plays the current sequence of sounds
async function playSequence() {
    console.log("Playing sequence..."); // Log for debugging
    playButton.disabled = true; // Disable button during playback to prevent issues
    for (const soundName of currentSequence) {
        if (sounds[soundName]) {
            // Clone the audio element to allow rapid playback without cutting off previous sounds
            const soundToPlay = sounds[soundName].cloneNode();
            soundToPlay.volume = 0.7; // Adjust volume if needed (0.0 to 1.0)
            soundToPlay.play(); // Play the sound
            // Wait a short duration before playing the next sound to create a rhythm
            await new Promise(resolve => setTimeout(resolve, 300)); // Wait for 300 milliseconds
        } else {
             console.warn(`Sound file not found for: ${soundName}`); // Warn if sound file is missing
        }
    }
    playButton.disabled = false; // Re-enable the play button after playback
    console.log("Finished playing sequence."); // Log for debugging
}

// Saves the current sequence as a new commit
function commit() {
    console.log("Attempting to commit..."); // Log for debugging
    // Prevent committing if the sequence is empty and there are no previous commits on this branch
    if (currentSequence.length === 0 && branches[currentBranch] === null) {
        alert("Nothing to commit. Add some sounds first.");
        console.log("Commit failed: Nothing to commit."); // Log for debugging
        return;
    }

    // Generate a unique commit ID
    const commitId = 'c' + commitCounter++;
    // Store a *copy* of the current sequence in the commits object
    commits[commitId] = [...currentSequence];
    // Update the current branch to point to this new commit (its HEAD moves)
    branches[currentBranch] = commitId;

    // Notify the user
    alert(`Committed current sequence to branch '${currentBranch}' as commit ${commitId}!`);
    console.log(`Commit successful: ${commitId} on branch '${currentBranch}'.`); // Log for debugging

    // Update the UI displays
    renderHistory();
    renderBranchSelects(); // Update branch display in case a branch pointer moved
}

// Creates a new branch pointing to the current commit
function createBranch() {
    console.log("Attempting to create branch..."); // Log for debugging
    const newBranchName = prompt("Enter a name for the new branch:");
    if (!newBranchName) {
        console.log("Create branch cancelled by user."); // Log for debugging
        return; // User cancelled or entered empty name
    }
    // Basic validation for branch name (can be improved)
    if (branches[newBranchName]) {
        alert(`Branch '${newBranchName}' already exists.`);
        console.log(`Create branch failed: Branch '${newBranchName}' already exists.`); // Log for debugging
        return;
    }
     // Cannot create a branch if the current branch has no commits yet
     if (branches[currentBranch] === null) {
         alert("Cannot create a branch from an empty history. Make a commit first on the current branch.");
         console.log("Create branch failed: No commits on current branch."); // Log for debugging
         return;
     }

    // The new branch starts by pointing to the same commit as the current branch
    branches[newBranchName] = branches[currentBranch];
    alert(`Created new branch '${newBranchName}' pointing to commit ${branches[currentBranch]}.`);
    console.log(`Branch created: '${newBranchName}' pointing to ${branches[currentBranch]}.`); // Log for debugging

    // Update the UI displays
    renderBranchSelects(); // Add the new branch to the dropdowns
    renderHistory(); // History display might show the new branch pointer
}

// Switches the working directory and HEAD to a different branch
function switchBranch() {
    console.log("Attempting to switch branch..."); // Log for debugging
    const targetBranch = branchSelect.value; // Get the selected branch name
    if (targetBranch === currentBranch) {
        alert(`You are already on branch '${targetBranch}'.`);
        console.log(`Switch branch failed: Already on branch '${targetBranch}'.`); // Log for debugging
        return;
    }
     // Check if the target branch exists
     if (!branches[targetBranch]) {
         alert(`Branch '${targetBranch}' not found.`);
         console.log(`Switch branch failed: Branch '${targetBranch}' not found.`); // Log for debugging
         return;
     }

     // Load the sequence corresponding to the commit the target branch points to
     if (branches[targetBranch] === null) {
         // Switching to a branch with no commits means an empty sequence
         currentSequence = [];
         console.log(`Switched to branch '${targetBranch}'. Branch has no commits, sequence is empty.`); // Log for debugging
     } else {
        const targetCommitId = branches[targetBranch];
        currentSequence = [...commits[targetCommitId]]; // Load a copy of the sequence from the commit
        console.log(`Switched to branch '${targetBranch}'. Loaded sequence from commit ${targetCommitId}.`); // Log for debugging
     }

    // Update the current branch tracker
    currentBranch = targetBranch;
    alert(`Switched to branch '${currentBranch}'.`);

    // Update the UI displays
    renderSequence(); // Show the sequence of the new branch
    renderBranchSelects(); // Update dropdowns to show current branch
    renderHistory(); // History display might highlight the new HEAD
}

// Merges a selected branch's changes into the current branch
function mergeBranch() {
    console.log("Attempting to merge branch..."); // Log for debugging
    const sourceBranch = mergeSelect.value; // Get the branch to merge from
    if (!sourceBranch) {
        alert("Please select a branch to merge.");
        console.log("Merge failed: No source branch selected."); // Log for debugging
        return;
    }
    if (sourceBranch === currentBranch) {
        alert("Cannot merge a branch into itself.");
        console.log("Merge failed: Cannot merge into self."); // Log for debugging
        return;
    }
     // Check if the source branch exists
     if (!branches[sourceBranch]) {
         alert(`Source branch '${sourceBranch}' not found.`);
         console.log(`Merge failed: Source branch '${sourceBranch}' not found.`); // Log for debugging
         return;
     }
     // Check if the source branch has any commits to merge
     if (branches[sourceBranch] === null) {
          alert(`Source branch '${sourceBranch}' has no commits to merge.`);
          console.log(`Merge failed: Source branch '${sourceBranch}' has no commits.`); // Log for debugging
          return;
     }
     // Check if the current branch has any commits to merge into
     if (branches[currentBranch] === null) {
         alert(`Current branch '${currentBranch}' has no commits to merge into. Make a commit first.`);
         console.log(`Merge failed: Current branch '${currentBranch}' has no commits.`); // Log for debugging
         return;
     }


    // --- Simplified Merge Logic ---
    // In real Git, merge is a complex process involving finding a common ancestor,
    // calculating differences (diffs), and applying changes. Conflicts can occur.
    // Here, for simplicity, we will just append the entire sequence from the
    // source branch's latest commit to the current sequence.
    // This is NOT how Git merge truly works but serves as a basic illustration
    // of bringing work from one line of development into another.

    const sourceCommitId = branches[sourceBranch];
    const sourceSequence = commits[sourceCommitId];

    // Create a new sequence by combining the current sequence and the source sequence
    const mergedSequence = [...currentSequence, ...sourceSequence];


    // Create a new commit on the current branch with the merged sequence
    const newCommitId = 'c' + commitCounter++;
    commits[newCommitId] = mergedSequence;
    // The current branch's HEAD now points to this new merge commit
    branches[currentBranch] = newCommitId;
    // Update the sequence being edited to the result of the merge
    currentSequence = mergedSequence;

    // Notify the user
    alert(`Merged branch '${sourceBranch}' into '${currentBranch}'. Created new commit ${newCommitId}.`);
    console.log(`Merge successful: '${sourceBranch}' into '${currentBranch}'. New commit ${newCommitId}.`); // Log for debugging

    // Update the UI displays
    renderSequence(); // Show the new merged sequence
    renderHistory(); // History will show the new merge commit and the updated branch pointer
    renderBranchSelects(); // Update branch pointers in dropdowns
    mergeSelect.value = ""; // Reset merge select dropdown
}


// --- Event Listeners ---
// Add event listeners to the sound buttons to add sounds to the sequence
// Ensure the DOM is fully loaded before attaching listeners
document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed'); // Confirm DOM is ready

    soundButtons.forEach(button => {
        button.addEventListener('click', () => {
            const sound = button.dataset.sound; // Get the sound name from the data attribute
            addSound(sound); // Call the function to add the sound
        });
    });

    // Add event listeners to the Git action buttons
    if (playButton) playButton.addEventListener('click', playSequence); else console.error("Play button not found!");
    if (commitButton) commitButton.addEventListener('click', commit); else console.error("Commit button not found!");
    if (createBranchButton) createBranchButton.addEventListener('click', createBranch); else console.error("Create Branch button not found!");
    if (switchBranchButton) switchBranchButton.addEventListener('click', switchBranch); else console.error("Switch Branch button not found!");
    if (mergeButton) mergeButton.addEventListener('click', mergeBranch); else console.error("Merge button not found!");

    // --- Initialization ---
    // Render the initial state of the UI when the page loads
    renderSequence(); // Display the initial empty sequence
    renderHistory(); // Display initial history state (no commits)
    renderBranchSelects(); // Populate branch dropdowns (only 'main' initially)

    console.log("Event listeners attached and initial render complete."); // Confirm setup is done
});

// Add a check to see if the script file itself is loaded
console.log("script.js is loading...");
