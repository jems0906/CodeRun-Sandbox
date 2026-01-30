const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use in-memory database for Railway (ephemeral storage)
const DB_PATH = ':memory:';

let db = null;

async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                reject(err);
                return;
            }
            console.log('Connected to in-memory SQLite database');
            createTables()
                .then(() => seedData())
                .then(resolve)
                .catch(reject);
        });
    });
}

async function createTables() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Problems table
            db.run(`CREATE TABLE IF NOT EXISTS problems (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                difficulty TEXT CHECK(difficulty IN ('Easy', 'Medium', 'Hard')) NOT NULL,
                category TEXT NOT NULL,
                function_signature_python TEXT,
                function_signature_javascript TEXT,
                test_cases TEXT NOT NULL,
                solution_python TEXT,
                solution_javascript TEXT,
                time_complexity TEXT,
                space_complexity TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Submissions table
            db.run(`CREATE TABLE IF NOT EXISTS submissions (
                id TEXT PRIMARY KEY,
                problem_id INTEGER NOT NULL,
                language TEXT CHECK(language IN ('python', 'javascript')) NOT NULL,
                code TEXT NOT NULL,
                status TEXT CHECK(status IN ('pending', 'running', 'completed', 'failed', 'timeout')) NOT NULL,
                result TEXT,
                runtime_ms INTEGER,
                memory_kb INTEGER,
                test_results TEXT,
                error_message TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                FOREIGN KEY (problem_id) REFERENCES problems (id)
            )`);

            // User statistics table (simplified)
            db.run(`CREATE TABLE IF NOT EXISTS user_stats (
                user_id TEXT PRIMARY KEY,
                problems_solved INTEGER DEFAULT 0,
                total_submissions INTEGER DEFAULT 0,
                success_rate REAL DEFAULT 0.0,
                average_runtime REAL DEFAULT 0.0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Test cases table for better organization
            db.run(`CREATE TABLE IF NOT EXISTS test_cases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                problem_id INTEGER NOT NULL,
                input TEXT NOT NULL,
                expected_output TEXT NOT NULL,
                is_sample BOOLEAN DEFAULT FALSE,
                is_hidden BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (problem_id) REFERENCES problems (id)
            )`, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('Database tables created successfully');
                    resolve();
                }
            });
        });
    });
}

async function seedData() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Insert the 6 classic algorithm problems
            const problems = [
                {
                    title: "Two Sum",
                    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
                    difficulty: "Easy",
                    category: "Array",
                    function_signature_python: "def twoSum(nums, target):\n    # Write your code here\n    pass",
                    function_signature_javascript: "function twoSum(nums, target) {\n    // Write your code here\n}",
                    test_cases: JSON.stringify([
                        {input: [2,7,11,15], target: 9, expected: [0,1]},
                        {input: [3,2,4], target: 6, expected: [1,2]},
                        {input: [3,3], target: 6, expected: [0,1]}
                    ]),
                    examples: "Input: nums = [2,7,11,15], target = 9\\nOutput: [0,1]\\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].",
                    constraints: "2 <= nums.length <= 10^4\\n-10^9 <= nums[i] <= 10^9\\n-10^9 <= target <= 10^9\\nOnly one valid answer exists."
                },
                {
                    title: "Add Two Numbers",
                    description: "You are given two non-empty linked lists representing two non-negative integers. Add the two numbers and return the sum as a linked list.",
                    difficulty: "Medium",
                    category: "Linked List",
                    function_signature_python: "def addTwoNumbers(l1, l2):\n    # Write your code here\n    pass",
                    function_signature_javascript: "function addTwoNumbers(l1, l2) {\n    // Write your code here\n}",
                    test_cases: JSON.stringify([
                        {input: [[2,4,3], [5,6,4]], expected: [7,0,8]},
                        {input: [[0], [0]], expected: [0]},
                        {input: [[9,9,9,9,9,9,9], [9,9,9,9]], expected: [8,9,9,9,0,0,0,1]}
                    ]),
                    examples: "Input: l1 = [2,4,3], l2 = [5,6,4]\\nOutput: [7,0,8]\\nExplanation: 342 + 465 = 807.",
                    constraints: "The number of nodes in each linked list is in the range [1, 100].\\n0 <= Node.val <= 9"
                },
                {
                    title: "Longest Substring Without Repeating Characters",
                    description: "Given a string s, find the length of the longest substring without repeating characters.",
                    difficulty: "Medium",
                    category: "String",
                    function_signature_python: "def lengthOfLongestSubstring(s):\n    # Write your code here\n    pass",
                    function_signature_javascript: "function lengthOfLongestSubstring(s) {\n    // Write your code here\n}",
                    test_cases: JSON.stringify([
                        {input: "abcabcbb", expected: 3},
                        {input: "bbbbb", expected: 1},
                        {input: "pwwkew", expected: 3}
                    ]),
                    examples: "Input: s = 'abcabcbb'\\nOutput: 3\\nExplanation: The answer is 'abc', with the length of 3.",
                    constraints: "0 <= s.length <= 5 * 10^4\\ns consists of English letters, digits, symbols and spaces."
                },
                {
                    title: "Median of Two Sorted Arrays",
                    description: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
                    difficulty: "Hard",
                    category: "Array",
                    function_signature_python: "def findMedianSortedArrays(nums1, nums2):\n    # Write your code here\n    pass",
                    function_signature_javascript: "function findMedianSortedArrays(nums1, nums2) {\n    // Write your code here\n}",
                    test_cases: JSON.stringify([
                        {input: [[1,3], [2]], expected: 2.0},
                        {input: [[1,2], [3,4]], expected: 2.5}
                    ]),
                    examples: "Input: nums1 = [1,3], nums2 = [2]\\nOutput: 2.00000\\nExplanation: merged array = [1,2,3] and median is 2.",
                    constraints: "nums1.length == m\\nnums2.length == n\\n0 <= m <= 1000\\n0 <= n <= 1000"
                },
                {
                    title: "Valid Parentheses",
                    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
                    difficulty: "Easy",
                    category: "Stack",
                    function_signature_python: "def isValid(s):\n    # Write your code here\n    pass",
                    function_signature_javascript: "function isValid(s) {\n    // Write your code here\n}",
                    test_cases: JSON.stringify([
                        {input: "()", expected: true},
                        {input: "()[]{}", expected: true},
                        {input: "(]", expected: false}
                    ]),
                    examples: "Input: s = '()'\\nOutput: true\\nExplanation: '' is a valid parentheses string.",
                    constraints: "1 <= s.length <= 10^4\\ns consists of parentheses only '()[]{}'."
                },
                {
                    title: "Best Time to Buy and Sell Stock",
                    description: "You are given an array prices where prices[i] is the price of a given stock on the ith day. Find the maximum profit you can achieve.",
                    difficulty: "Easy",
                    category: "Array",
                    function_signature_python: "def maxProfit(prices):\n    # Write your code here\n    pass",
                    function_signature_javascript: "function maxProfit(prices) {\n    // Write your code here\n}",
                    test_cases: JSON.stringify([
                        {input: [7,1,5,3,6,4], expected: 5},
                        {input: [7,6,4,3,1], expected: 0}
                    ]),
                    examples: "Input: prices = [7,1,5,3,6,4]\\nOutput: 5\\nExplanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.",
                    constraints: "1 <= prices.length <= 10^5\\n0 <= prices[i] <= 10^4"
                }
            ];

            const stmt = db.prepare(`
                INSERT INTO problems (title, description, difficulty, category, function_signature_python, function_signature_javascript, test_cases, examples, constraints)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            problems.forEach(problem => {
                stmt.run(
                    problem.title,
                    problem.description,
                    problem.difficulty,
                    problem.category,
                    problem.function_signature_python,
                    problem.function_signature_javascript,
                    problem.test_cases,
                    problem.examples,
                    problem.constraints
                );
            });

            stmt.finalize();
            console.log('✅ Database seeded with 6 algorithm problems');
            resolve();
        });
    });
}

function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
}

function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ lastID: this.lastID, changes: this.changes });
            }
        });
    });
}

function getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function allQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = {
    initializeDatabase,
    initDatabase: initializeDatabase,  // Alias for compatibility
    getDb: getDatabase,
    getDatabase,
    runQuery,
    getQuery,
    allQuery
};