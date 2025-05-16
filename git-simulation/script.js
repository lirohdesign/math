// --- Sound Setup ---
// Get the audio elements from the HTML
const sounds = {
    '0': document.getElementById('bass-sound'), // Bass sound for '0'
    '-': document.getElementById('snare-sound'), // Snare sound for '-'
    "'": document.getElementById('hihat-sound'), // HiHat sound for "'"
    ' ': null // Space represents a rest, no sound needed
};

// Tempo and timing
const tempo = 100; // BPM (Beats Per Minute)
const sixteenthNoteTime = (60 / tempo) / 4; // Time in seconds for a 1/16 note

// --- Git Simulation Data Structure ---
// 'commits' stores snapshots of sequences (now text strings), keyed by a simple commit ID.
// { commitId: '0- ''0 ', ... }
let commits = {};
// 'branches' maps branch names to the commitId they currently point to.
// 'main' is the default branch. null means no commits on this branch yet.
let branches = {
    'main': null
};
// 'currentBranch' tracks which branch the user is currently working on.
let currentBranch = 'main';
// 'currentSequence' holds the sequence text string being actively edited.
let currentSequence = '';
// Simple counter to generate unique commit IDs.
let commitCounter = 0;

// --- UI Elements ---
// Get references to the HTML elements we'll interact with
const currentBranchNameDisplay = document.getElementById('current-branch-name');
const currentBranchEditor = document.getElementById('current-branch-editor');
const branchListDisplay = document.getElementById('branch-list');
const historyDisplay = document.getElementById('history');
const playButton = document.getElementById('play-btn');
const commitButton = document.getElementById('commit-btn');
const createBranchButton = document.getElementById('create-branch-btn');
const mergeSelect = document.getElementById('merge-select');
const mergeButton = document.getElementById('merge-btn');

// --- Functions ---

// Updates the visual display of the current song sequence in the editor
function renderSequence() {
    currentBranchEditor.textContent = currentSequence; // Set the text content of the editable div
     currentBranchNameDisplay.textContent = currentBranch; // Update the current branch name display
}

// Updates the list of branches in the sidebar
function renderBranchList() {
    branchListDisplay.innerHTML = ''; // Clear current list

    // Sort branches alphabetically
    const sortedBranchNames = Object.keys(branches).sort();

    sortedBranchNames.forEach(branchName => {
        const branchItem = document.createElement('div');
        branchItem.classList.add('branch-item');
        if (branchName === currentBranch) {
            branchItem.classList.add('current'); // Highlight the current branch
        }

        const branchNameSpan = document.createElement('span');
        branchNameSpan.classList.add('branch-name');
        branchNameSpan.textContent = branchName;
        branchItem.appendChild(branchNameSpan);

        const sequencePreviewSpan = document.createElement('span');
        sequencePreviewSpan.classList.add('branch-sequence-preview');
        // Show the sequence of the commit this branch points to, or a default message
        const commitId = branches[branchName];
        sequencePreviewSpan.textContent = commitId ? commits[commitId] : 'No commits yet';
        branchItem.appendChild(sequencePreviewSpan);


        // Add a Checkout button if it's not the current branch
        if (branchName !== currentBranch) {
            const checkoutButton = document.createElement('button');
            checkoutButton.classList.add('checkout-button');
            checkoutButton.textContent = 'Checkout';
            // Use a data attribute to store the branch name for the event listener
            checkoutButton.dataset.branchName = branchName;
            branchItem.appendChild(checkoutButton);
        }

        branchListDisplay.appendChild(branchItem);
    });

     // Add event listeners to the new checkout buttons
     branchListDisplay.querySelectorAll('.checkout-button').forEach(button => {
         button.addEventListener('click', (event) => {
             const branchToCheckout = event.target.dataset.branchName;
             switchBranch(branchToCheckout); // Call the switchBranch function
         });
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
        historyText += `- Commit ${commitId}${branchPointers}${headPointer}: "${commits[commitId]}"\n`;
    });

    // If there are no commits yet, display an initial state message
    if (sortedCommitIds.length === 0) {
         historyText += `- Initial state (no commits yet on branch '${currentBranch}')\n`;
    }

    // Set the history display text
    historyDisplay.textContent = historyText;
}


// Updates the options in the merge selection dropdown
function renderMergeSelect() {
    mergeSelect.innerHTML = '<option value="">-- Select Branch --</option>'; // Clear current options for merging

    // Add each branch as an option, but exclude the current branch
    Object.keys(branches).forEach(branchName => {
        if (branchName !== currentBranch) {
             const mergeOption = document.createElement('option');
             mergeOption.value = branchName;
             mergeOption.textContent = branchName;
             mergeSelect.appendChild(mergeOption);
        }
    });
}


// Plays the current sequence of sounds based on the text string
async function playSequence() {
    console.log("Playing sequence..."); // Log for debugging
    playButton.disabled = true; // Disable button during playback to prevent issues

    const sequenceText = currentBranchEditor.textContent; // Get the current text from the editor

    for (const char of sequenceText) {
        const soundKey = char; // The character is the key for the sound

        if (sounds[soundKey]) { // Check if there's a defined sound for this character
            // Clone the audio element to allow rapid playback without cutting off previous sounds
            const soundToPlay = sounds[soundKey].cloneNode();
            soundToPlay.volume = 0.7; // Adjust volume if needed (0.0 to 1.0)
            soundToPlay.play(); // Play the sound
        } else if (soundKey !== ' ') {
             console.warn(`Unknown character in sequence: '${soundKey}'. Skipping.`); // Warn for unknown characters (excluding space)
        }

        // Wait for the duration of a 1/16 note before the next character/sound
        await new Promise(resolve => setTimeout(resolve, sixteenthNoteTime * 1000)); // Convert seconds to milliseconds
    }

    playButton.disabled = false; // Re-enable the play button after playback
    console.log("Finished playing sequence."); // Log for debugging
}

// Saves the current sequence text as a new commit
function commit() {
    console.log("Attempting to commit..."); // Log for debugging

    // Get the current text from the editor
    const sequenceToCommit = currentBranchEditor.textContent;

    // Prevent committing if the sequence is empty and there are no previous commits on this branch
    if (sequenceToCommit.length === 0 && branches[currentBranch] === null) {
        alert("Nothing to commit. Add some sounds (type in the editor) first.");
        console.log("Commit failed: Nothing to commit."); // Log for debugging
        return;
    }

    // Generate a unique commit ID
    const commitId = 'c' + commitCounter++;
    // Store the current sequence text in the commits object
    commits[commitId] = sequenceToCommit;
    // Update the current branch to point to this new commit (its HEAD moves)
    branches[currentBranch] = commitId;

    // Notify the user
    alert(`Committed current sequence to branch '${currentBranch}' as commit ${commitId}!`);
    console.log(`Commit successful: ${commitId} on branch '${currentBranch}'.`); // Log for debugging

    // Update the UI displays
    renderHistory();
    renderBranchList(); // Update branch list to show updated commit pointer
    renderMergeSelect(); // Update merge options
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
    renderBranchList(); // Add the new branch to the list
    renderMergeSelect(); // Add the new branch to merge options
    renderHistory(); // History display might show the new branch pointer
}

// Switches the working directory and HEAD to a different branch
// This function is now called by the checkout buttons in the branch list
function switchBranch(targetBranch) {
    console.log(`Attempting to switch to branch: ${targetBranch}`); // Log for debugging
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
         currentSequence = '';
         console.log(`Switched to branch '${targetBranch}'. Branch has no commits, sequence is empty.`); // Log for debugging
     } else {
        const targetCommitId = branches[targetBranch];
        currentSequence = commits[targetCommitId]; // Load the sequence text from the commit
        console.log(`Switched to branch '${targetBranch}'. Loaded sequence from commit ${targetCommitId}.`); // Log for debugging
     }

    // Update the current branch tracker
    currentBranch = targetBranch;
    alert(`Switched to branch '${currentBranch}'.`);

    // Update the UI displays
    renderSequence(); // Show the sequence of the new branch in the editor
    renderBranchList(); // Update branch list to highlight the current branch
    renderMergeSelect(); // Update merge options (current branch can't be merged into itself)
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


    // --- Simplified Text Merge Logic ---
    // In real Git, merge is a complex process involving finding a common ancestor,
    // calculating differences (diffs), and applying changes line by line. Conflicts can occur.
    // Here, for simplicity, we will just append the entire sequence string from the
    // source branch's latest commit to the current sequence string.
    // This is NOT how Git merge truly works but serves as a basic illustration
    // of bringing work from one line of development into another.

    const sourceCommitId = branches[sourceBranch];
    const sourceSequence = commits[sourceCommitId];
    const currentSequenceText = currentBranchEditor.textContent; // Get current text from editor

    // Create a new sequence by combining the current sequence and the source sequence
    const mergedSequence = currentSequenceText + sourceSequence;


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
    renderSequence(); // Show the new merged sequence in the editor
    renderHistory(); // History will show the new merge commit and the updated branch pointer
    renderBranchList(); // Update branch list
    renderMergeSelect(); // Update merge options
    mergeSelect.value = ""; // Reset merge select dropdown
}


// --- Event Listeners ---
// Ensure the DOM is fully loaded before attaching listeners and initializing
document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed'); // Confirm DOM is ready

    // Add event listeners to the Git action buttons
    if (playButton) playButton.addEventListener('click', playSequence); else console.error("Play button not found!");
    if (commitButton) commitButton.addEventListener('click', commit); else console.error("Commit button not found!");
    if (createBranchButton) createBranchButton.addEventListener('click', createBranch); else console.error("Create Branch button not found!");
    if (mergeButton) mergeButton.addEventListener('click', mergeBranch); else console.error("Merge button not found!");

    // Listen for input on the editable editor area to keep currentSequence updated
    if (currentBranchEditor) {
        currentBranchEditor.addEventListener('input', () => {
            currentSequence = currentBranchEditor.textContent;
            // No need to re-render the editor here, as the input event handles it.
            // But we might want to update the branch list preview if the user stops typing for a bit?
            // For simplicity, we'll only update previews on commit/switch/merge.
        });
    } else {
        console.error("Current branch editor not found!");
    }


    // --- Initialization ---
    // Render the initial state of the UI when the page loads
    renderSequence(); // Display the initial empty sequence in the editor
    renderBranchList(); // Display the initial branch list ('main')
    renderMergeSelect(); // Populate merge dropdown (empty initially)
    renderHistory(); // Display initial history state (no commits)


    console.log("Event listeners attached and initial render complete."); // Confirm setup is done
});

// Add a check to see if the script file itself is loaded
console.log("script.js is loading...");
