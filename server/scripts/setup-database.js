const { initializeDatabase, runQuery } = require('../config/database');

const SAMPLE_PROBLEMS = [
    {
        title: "Two Sum",
        description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

**Example 1:**
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

**Example 2:**
Input: nums = [3,2,4], target = 6
Output: [1,2]

**Example 3:**
Input: nums = [3,3], target = 6
Output: [0,1]

**Constraints:**
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists.`,
        difficulty: "Easy",
        category: "Array",
        function_signature_python: "def twoSum(nums, target):",
        function_signature_javascript: "function twoSum(nums, target) {",
        test_cases: JSON.stringify([
            { input: [[2, 7, 11, 15], 9], expected: [0, 1], is_sample: true },
            { input: [[3, 2, 4], 6], expected: [1, 2], is_sample: true },
            { input: [[3, 3], 6], expected: [0, 1], is_sample: true },
            { input: [[-1, -2, -3, -4, -5], -8], expected: [2, 4] },
            { input: [[0, 4, 3, 0], 0], expected: [0, 3] }
        ]),
        solution_python: `def twoSum(nums, target):
    num_map = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in num_map:
            return [num_map[complement], i]
        num_map[num] = i
    return []`,
        solution_javascript: `function twoSum(nums, target) {
    const numMap = {};
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (complement in numMap) {
            return [numMap[complement], i];
        }
        numMap[nums[i]] = i;
    }
    return [];
}`,
        time_complexity: "O(n)",
        space_complexity: "O(n)"
    },
    {
        title: "Valid Parentheses",
        description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

**Example 1:**
Input: s = "()"
Output: true

**Example 2:**
Input: s = "()[]{}"
Output: true

**Example 3:**
Input: s = "(]"
Output: false

**Constraints:**
- 1 <= s.length <= 10^4
- s consists of parentheses only '()[]{}.'`,
        difficulty: "Easy",
        category: "Stack",
        function_signature_python: "def isValid(s):",
        function_signature_javascript: "function isValid(s) {",
        test_cases: JSON.stringify([
            { input: ["()"], expected: true, is_sample: true },
            { input: ["()[]{}"], expected: true, is_sample: true },
            { input: ["(]"], expected: false, is_sample: true },
            { input: ["([)]"], expected: false },
            { input: ["{[]}"], expected: true },
            { input: [""], expected: true },
            { input: ["(((("], expected: false }
        ]),
        solution_python: `def isValid(s):
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    
    for char in s:
        if char in mapping:
            top_element = stack.pop() if stack else '#'
            if mapping[char] != top_element:
                return False
        else:
            stack.append(char)
    
    return not stack`,
        solution_javascript: `function isValid(s) {
    const stack = [];
    const mapping = { ')': '(', '}': '{', ']': '[' };
    
    for (const char of s) {
        if (char in mapping) {
            const topElement = stack.length > 0 ? stack.pop() : '#';
            if (mapping[char] !== topElement) {
                return false;
            }
        } else {
            stack.push(char);
        }
    }
    
    return stack.length === 0;
}`,
        time_complexity: "O(n)",
        space_complexity: "O(n)"
    },
    {
        title: "Binary Search",
        description: `Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.

**Example 1:**
Input: nums = [-1,0,3,5,9,12], target = 9
Output: 4
Explanation: 9 exists in nums and its index is 4

**Example 2:**
Input: nums = [-1,0,3,5,9,12], target = 2
Output: -1
Explanation: 2 does not exist in nums so return -1

**Constraints:**
- 1 <= nums.length <= 10^4
- -10^4 < nums[i], target < 10^4
- All the integers in nums are unique.
- nums is sorted in ascending order.`,
        difficulty: "Easy",
        category: "Binary Search",
        function_signature_python: "def search(nums, target):",
        function_signature_javascript: "function search(nums, target) {",
        test_cases: JSON.stringify([
            { input: [[-1,0,3,5,9,12], 9], expected: 4, is_sample: true },
            { input: [[-1,0,3,5,9,12], 2], expected: -1, is_sample: true },
            { input: [[5], 5], expected: 0 },
            { input: [[1,2,3,4,5], 1], expected: 0 },
            { input: [[1,2,3,4,5], 5], expected: 4 }
        ]),
        solution_python: `def search(nums, target):
    left, right = 0, len(nums) - 1
    
    while left <= right:
        mid = left + (right - left) // 2
        
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1`,
        solution_javascript: `function search(nums, target) {
    let left = 0, right = nums.length - 1;
    
    while (left <= right) {
        const mid = left + Math.floor((right - left) / 2);
        
        if (nums[mid] === target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return -1;
}`,
        time_complexity: "O(log n)",
        space_complexity: "O(1)"
    },
    {
        title: "Maximum Subarray",
        description: `Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.

A subarray is a contiguous part of an array.

**Example 1:**
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: [4,-1,2,1] has the largest sum = 6.

**Example 2:**
Input: nums = [1]
Output: 1

**Example 3:**
Input: nums = [5,4,-1,7,8]
Output: 23

**Constraints:**
- 1 <= nums.length <= 10^5
- -10^4 <= nums[i] <= 10^4

**Follow up:** If you have figured out the O(n) solution, try coding another solution using the divide and conquer approach, which is more subtle.`,
        difficulty: "Medium",
        category: "Dynamic Programming",
        function_signature_python: "def maxSubArray(nums):",
        function_signature_javascript: "function maxSubArray(nums) {",
        test_cases: JSON.stringify([
            { input: [[-2,1,-3,4,-1,2,1,-5,4]], expected: 6, is_sample: true },
            { input: [[1]], expected: 1, is_sample: true },
            { input: [[5,4,-1,7,8]], expected: 23, is_sample: true },
            { input: [[-1]], expected: -1 },
            { input: [[-2,-1,-3,-4]], expected: -1 }
        ]),
        solution_python: `def maxSubArray(nums):
    max_sum = current_sum = nums[0]
    
    for num in nums[1:]:
        current_sum = max(num, current_sum + num)
        max_sum = max(max_sum, current_sum)
    
    return max_sum`,
        solution_javascript: `function maxSubArray(nums) {
    let maxSum = nums[0];
    let currentSum = nums[0];
    
    for (let i = 1; i < nums.length; i++) {
        currentSum = Math.max(nums[i], currentSum + nums[i]);
        maxSum = Math.max(maxSum, currentSum);
    }
    
    return maxSum;
}`,
        time_complexity: "O(n)",
        space_complexity: "O(1)"
    },
    {
        title: "Merge Two Sorted Lists",
        description: `You are given the heads of two sorted linked lists list1 and list2.

Merge the two lists in a one sorted list. The list should be made by splicing together the nodes of the first two lists.

Return the head of the merged linked list.

**Example 1:**
Input: list1 = [1,2,4], list2 = [1,3,4]
Output: [1,1,2,3,4,4]

**Example 2:**
Input: list1 = [], list2 = []
Output: []

**Example 3:**
Input: list1 = [], list2 = [0]
Output: [0]

**Constraints:**
- The number of nodes in both lists is in the range [0, 50].
- -100 <= Node.val <= 100
- Both list1 and list2 are sorted in non-decreasing order.

Note: For simplicity, we'll work with arrays instead of linked list nodes in this implementation.`,
        difficulty: "Easy",
        category: "Linked List",
        function_signature_python: "def mergeTwoLists(list1, list2):",
        function_signature_javascript: "function mergeTwoLists(list1, list2) {",
        test_cases: JSON.stringify([
            { input: [[1,2,4], [1,3,4]], expected: [1,1,2,3,4,4], is_sample: true },
            { input: [[], []], expected: [], is_sample: true },
            { input: [[], [0]], expected: [0], is_sample: true },
            { input: [[1,3,5], [2,4,6]], expected: [1,2,3,4,5,6] },
            { input: [[1,2,3], []], expected: [1,2,3] }
        ]),
        solution_python: `def mergeTwoLists(list1, list2):
    result = []
    i = j = 0
    
    while i < len(list1) and j < len(list2):
        if list1[i] <= list2[j]:
            result.append(list1[i])
            i += 1
        else:
            result.append(list2[j])
            j += 1
    
    result.extend(list1[i:])
    result.extend(list2[j:])
    
    return result`,
        solution_javascript: `function mergeTwoLists(list1, list2) {
    const result = [];
    let i = 0, j = 0;
    
    while (i < list1.length && j < list2.length) {
        if (list1[i] <= list2[j]) {
            result.push(list1[i]);
            i++;
        } else {
            result.push(list2[j]);
            j++;
        }
    }
    
    result.push(...list1.slice(i));
    result.push(...list2.slice(j));
    
    return result;
}`,
        time_complexity: "O(m + n)",
        space_complexity: "O(m + n)"
    },
    {
        title: "Container With Most Water",
        description: `You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).

Find two lines that together with the x-axis form a container that can hold the most water.

Return the maximum amount of water a container can store.

Notice that you may not slant the container.

**Example 1:**
Input: height = [1,8,6,2,5,4,8,3,7]
Output: 49
Explanation: The above vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water (blue section) the container can contain is 49.

**Example 2:**
Input: height = [1,1]
Output: 1

**Constraints:**
- n == height.length
- 2 <= n <= 10^5
- 0 <= height[i] <= 10^4`,
        difficulty: "Medium",
        category: "Two Pointers",
        function_signature_python: "def maxArea(height):",
        function_signature_javascript: "function maxArea(height) {",
        test_cases: JSON.stringify([
            { input: [[1,8,6,2,5,4,8,3,7]], expected: 49, is_sample: true },
            { input: [[1,1]], expected: 1, is_sample: true },
            { input: [[4,3,2,1,4]], expected: 16 },
            { input: [[1,2,1]], expected: 2 },
            { input: [[1,3,2,5,25,24,5]], expected: 24 }
        ]),
        solution_python: `def maxArea(height):
    left, right = 0, len(height) - 1
    max_area = 0
    
    while left < right:
        width = right - left
        current_area = min(height[left], height[right]) * width
        max_area = max(max_area, current_area)
        
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    
    return max_area`,
        solution_javascript: `function maxArea(height) {
    let left = 0, right = height.length - 1;
    let maxArea = 0;
    
    while (left < right) {
        const width = right - left;
        const currentArea = Math.min(height[left], height[right]) * width;
        maxArea = Math.max(maxArea, currentArea);
        
        if (height[left] < height[right]) {
            left++;
        } else {
            right--;
        }
    }
    
    return maxArea;
}`,
        time_complexity: "O(n)",
        space_complexity: "O(1)"
    }
];

async function seedDatabase() {
    try {
        await initializeDatabase();
        
        console.log('Seeding database with sample problems...');
        
        for (const problem of SAMPLE_PROBLEMS) {
            await runQuery(`
                INSERT INTO problems (
                    title, description, difficulty, category,
                    function_signature_python, function_signature_javascript,
                    test_cases, solution_python, solution_javascript,
                    time_complexity, space_complexity
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                problem.title,
                problem.description,
                problem.difficulty,
                problem.category,
                problem.function_signature_python,
                problem.function_signature_javascript,
                problem.test_cases,
                problem.solution_python,
                problem.solution_javascript,
                problem.time_complexity,
                problem.space_complexity
            ]);
            
            console.log(`Added problem: ${problem.title}`);
        }
        
        console.log(`Successfully seeded ${SAMPLE_PROBLEMS.length} problems!`);
        console.log('Database setup complete.');
        
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase, SAMPLE_PROBLEMS };