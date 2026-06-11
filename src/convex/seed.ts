import type { Id, TableNames } from './_generated/dataModel';
import { internalMutation } from './_generated/server';

const TABLES: TableNames[] = [
  'signals',
  'users',
  'sections',
  'sectionTeachers',
  'sectionStudents',
  'activities',
  'problems',
  'activityProblems',
  'problemIos',
  'snapshots',
  'submissions',
  'chats',
  'chatMembers',
  'messages',
  'messageReactions',
  'posts',
  'tags',
  'postTags',
  'comments',
  'postVotes',
  'commentVotes',
  'presence',
  'typingIndicators',
  'uploadedImages',
  'sectionResources',
];

const DEFAULT_PASS = 'pass';
const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

function avatar(email: string) {
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${email}`;
}

function getUniqueDummies(sectionIdx: number, totalDummies: number, count: number): number[] {
  const set = new Set<number>();
  for (let i = 0; set.size < count; i++) {
    set.add((sectionIdx * 7 + i * 11) % totalDummies);
  }
  return [...set];
}

// ==================== USERS ====================

const MAIN_USERS = [
  {
    name: 'Stride Admin',
    email: 'admin@uiu.bd',
    role: 'admin' as const,
    aboutMd: 'Platform administrator for Stride. Overseeing academic operations and system integrity.',
  },
  {
    name: 'Sidratul Muntaha',
    email: 'sidratul@uiu.bd',
    role: 'teacher' as const,
    aboutMd:
      'Senior Lecturer at UIU. Teaching OOP, Data Structures, and Algorithms. Research interests include software engineering and AI in education.',
  },
  {
    name: 'Asnuva Tanvin',
    email: 'tanvin@uiu.bd',
    role: 'teacher' as const,
    aboutMd:
      'Lecturer at UIU. Passionate about teaching programming fundamentals, structured programming, and problem-solving.',
  },
];

const EXTRA_TEACHERS = [
  {
    name: 'Md. Jubayer Hossain',
    email: 'jubayer@uiu.bd',
    role: 'teacher' as const,
    aboutMd: 'Assistant Professor at UIU. Specializes in Web Technologies and Database Management Systems.',
  },
  {
    name: 'Dr. Farzana Yesmin',
    email: 'fyesmin@uiu.bd',
    role: 'teacher' as const,
    aboutMd: 'Associate Professor at UIU. Research areas include Machine Learning, AI, and Numerical Methods.',
  },
];

const HIGHLIGHTED_STUDENTS = [
  {
    name: 'Fahim Faisal',
    email: 'ffaisal23@uiu.bd',
    role: 'student' as const,
    aboutMd: 'CSE student at UIU. Competitive programmer, full-stack enthusiast. Love building side projects.',
  },
  {
    name: 'Rakibul Hasan',
    email: 'rhasan21@uiu.bd',
    role: 'student' as const,
    aboutMd: 'CSE student at UIU. Interested in systems programming and open source contributions.',
  },
];

const DUMMY_STUDENT_NAMES = [
  'Sadia Tabassum',
  'Nafis Ahmed',
  'Jannatul Ferdous',
  'Ariful Islam',
  'Tasnim Rahman',
  'Mehedi Hasan',
  'Nusrat Jahan',
  'Kabir Hossain',
  'Farzana Akter',
  'Shahriar Kabir',
  'Mim Khatun',
  'Tanvir Ahamed',
  'Sharmin Sultana',
  'Rakibul Islam',
  'Sajid Karim',
  'Mahmudul Hasan',
  'Nadia Sultana',
  'Imran Hossain',
  'Shihab Uddin',
  'Afroza Begum',
];

const DUMMY_STUDENTS = DUMMY_STUDENT_NAMES.map((name, i) => ({
  name,
  email: name.toLowerCase().replace(/[\s.]+/g, '') + '.' + (i + 1) + '@student.uiu.bd',
  role: 'student' as const,
}));

const ALL_USERS = [...MAIN_USERS, ...EXTRA_TEACHERS, ...HIGHLIGHTED_STUDENTS, ...DUMMY_STUDENTS];

// ==================== SECTIONS ====================

interface SectionConfig {
  name: string;
  aboutMd: string;
  teacherIndices: number[];
  mainStudentIndices: number[];
  dummyCount: number;
}

const SECTION_CONFIGS: SectionConfig[] = [
  {
    name: 'CSE 1111: Structured Programming Language',
    aboutMd:
      '<p>Master the fundamentals of <strong>structured programming</strong>. Learn control flow structures, conditional branches, multi-dimensional array manipulation, pointer arithmetic, and recursive function designs in standard C.</p>',
    teacherIndices: [2], // Tanvin
    mainStudentIndices: [5], // ffaisal
    dummyCount: 14,
  },
  {
    name: 'CSE 1115: Object Oriented Programming',
    aboutMd:
      '<p>An intensive deep dive into <em>Object-Oriented Programming (OOP)</em> paradigms. Key modules cover polymorphism, abstract interfaces, custom generics, advanced multi-threading, and robust exception recovery.</p>',
    teacherIndices: [1], // Sidratul
    mainStudentIndices: [5, 6], // ffaisal, rhasan
    dummyCount: 13,
  },
  {
    name: 'CSE 2215: Data Structures and Algorithms I',
    aboutMd:
      '<p>Analyze linear and non-linear memory structures. Students implement self-balancing search trees, stack implementations, heap management, sorting complexity, and topological graph traversals.</p>',
    teacherIndices: [2], // Tanvin
    mainStudentIndices: [5, 6], // ffaisal, rhasan
    dummyCount: 13,
  },
  {
    name: 'CSE 2217: Data Structures and Algorithms II',
    aboutMd:
      '<p>Advanced data structures including AVL trees, Red-Black trees, B-trees, hash tables, graph algorithms (MST, shortest path), and algorithmic paradigms (greedy, dynamic programming).</p>',
    teacherIndices: [1], // Sidratul
    mainStudentIndices: [6], // rhasan
    dummyCount: 14,
  },
  {
    name: 'CSE 3315: Design and Analysis of Algorithms',
    aboutMd:
      '<p>Theoretical and practical study of algorithm design. Topics include divide-and-conquer, DP, greedy algorithms, NP-completeness, approximation algorithms, and advanced graph techniques.</p>',
    teacherIndices: [1], // Sidratul
    mainStudentIndices: [5, 6], // ffaisal, rhasan
    dummyCount: 13,
  },
  {
    name: 'CSE 3321: Web Technologies',
    aboutMd:
      '<p>Full-stack web development covering HTML5, CSS3, JavaScript (ES6+), React, Node.js, Express, RESTful APIs, and modern deployment practices.</p>',
    teacherIndices: [3], // Jubayer
    mainStudentIndices: [5], // ffaisal
    dummyCount: 14,
  },
  {
    name: 'CSE 4415: Database Management Systems',
    aboutMd:
      '<p>Relational database design, SQL, normalization, query optimization, transaction management, NoSQL databases, and database security principles.</p>',
    teacherIndices: [3], // Jubayer
    mainStudentIndices: [6], // rhasan
    dummyCount: 14,
  },
  {
    name: 'CSE 4521: Machine Learning Fundamentals',
    aboutMd:
      '<p>Introduction to ML covering supervised learning (regression, classification, decision trees), unsupervised learning (clustering, PCA), neural networks, and model evaluation techniques.</p>',
    teacherIndices: [4], // Fyesmin
    mainStudentIndices: [],
    dummyCount: 15,
  },
];

// ==================== PROBLEMS ====================

interface ProblemDef {
  title: string;
  contentMd: string;
  ios: { input: string; output: string }[];
}

const SIDRATUL_PROBLEMS: ProblemDef[] = [
  {
    title: 'Bank Account Class',
    contentMd:
      'Create a `BankAccount` class with private fields `balance` and `accountId`. Implement `deposit(amount)` and `withdraw(amount)` methods. Throw an exception if withdrawal exceeds balance.',
    ios: [
      { input: 'deposit 1000\nwithdraw 500', output: 'Balance: 500' },
      { input: 'deposit 200\nwithdraw 300', output: 'Error: Insufficient funds' },
    ],
  },
  {
    title: 'Inheritance: Student-Class',
    contentMd:
      'Create a base class `Person` with name and age. Derive `Student` with studentId and GPA. Override `displayInfo()` to show all details.',
    ios: [{ input: 'Alice 20 S12345 3.8', output: 'Name: Alice, Age: 20\nID: S12345, GPA: 3.8' }],
  },
  {
    title: 'Polymorphism with Shapes',
    contentMd:
      'Define an interface `Shape` with `area()` method. Implement `Circle`, `Rectangle`, and `Triangle` classes. Write a function that accepts a Shape array and returns total area.',
    ios: [{ input: 'Circle 5\nRectangle 4 6', output: 'Total Area: 102.54' }],
  },
  {
    title: 'Abstract Class: Vehicle',
    contentMd:
      'Create an abstract class `Vehicle` with abstract method `startEngine()`. Implement `Car` and `Motorcycle` subclasses.',
    ios: [
      { input: 'Car', output: 'Car engine started with key ignition' },
      { input: 'Motorcycle', output: 'Motorcycle engine started with kick start' },
    ],
  },
  {
    title: 'Interface: Drawable',
    contentMd:
      'Define `Drawable` interface with `draw()` method. Implement it in `Circle`, `Square`, and `Line` classes. Each draws itself on the console using ASCII art.',
    ios: [
      { input: 'Circle', output: '  *  \n*   *\n  *  ' },
      { input: 'Square', output: '***\n* *\n***' },
    ],
  },
  {
    title: 'Exception: Division Calculator',
    contentMd: 'Write a calculator that handles division by zero and invalid input exceptions gracefully.',
    ios: [
      { input: '10 2', output: '5' },
      { input: '10 0', output: 'Error: Cannot divide by zero' },
    ],
  },
  {
    title: 'Generic Pair Class',
    contentMd:
      'Implement a generic `Pair<T, U>` class with `getFirst()`, `getSecond()`, `setFirst()`, `setSecond()`, and `swap()` methods.',
    ios: [{ input: '1 Hello', output: 'First: 1, Second: Hello\nAfter swap:\nFirst: Hello, Second: 1' }],
  },
  {
    title: 'Collections: Student Manager',
    contentMd:
      'Use ArrayList to manage a list of students. Implement add, remove, search by name, and display all sorted by GPA.',
    ios: [{ input: 'add Alice 3.8\nadd Bob 3.5\nlist', output: 'Bob (3.5)\nAlice (3.8)' }],
  },
  {
    title: 'Stream API: Filter & Map',
    contentMd:
      'Given a list of integers, filter out odd numbers and return squares of even numbers using Java Streams.',
    ios: [{ input: '1 2 3 4 5 6', output: '4, 16, 36' }],
  },
  {
    title: 'Binary Tree Inorder Traversal',
    contentMd:
      'Implement a binary tree class with `insert()` and `inorderTraversal()` methods returning values in sorted order.',
    ios: [{ input: '5 3 7 2 4 6 8', output: '2 3 4 5 6 7 8' }],
  },
  {
    title: 'Graph DFS Traversal',
    contentMd: 'Implement graph using adjacency list, addEdge(), and DFS() starting from a given vertex.',
    ios: [{ input: '5\n0 1\n0 2\n1 3\n1 4', output: '0 1 3 4 2' }],
  },
  {
    title: 'Heap Sort',
    contentMd: 'Implement heap sort algorithm. Build max-heap and sort the array in ascending order.',
    ios: [
      { input: '12 11 13 5 6 7', output: '5 6 7 11 12 13' },
      { input: '4 10 3 5 1', output: '1 3 4 5 10' },
    ],
  },
  {
    title: 'Quick Sort',
    contentMd: 'Implement the quicksort algorithm using Lomuto partition scheme.',
    ios: [{ input: '10 7 8 9 1 5', output: '1 5 7 8 9 10' }],
  },
  {
    title: 'DP: Fibonacci Numbers',
    contentMd:
      'Write a dynamic programming solution to find the N-th Fibonacci number. Optimize for O(N) time and O(1) space.',
    ios: [
      { input: '10', output: '55' },
      { input: '20', output: '6765' },
    ],
  },
];

const TANVIN_PROBLEMS: ProblemDef[] = [
  {
    title: 'Sum of Two Integers',
    contentMd: 'Read two integers A and B from input and print their sum.',
    ios: [
      { input: '5 10', output: '15' },
      { input: '100 200', output: '300' },
    ],
  },
  {
    title: 'Factorial Calculation',
    contentMd: 'Calculate the factorial of a given non-negative integer N using iteration.',
    ios: [
      { input: '5', output: '120' },
      { input: '0', output: '1' },
    ],
  },
  {
    title: 'Palindrome Checker',
    contentMd: 'Check if a given string is a palindrome. Print "Yes" or "No". Ignore case and spaces.',
    ios: [
      { input: 'madam', output: 'Yes' },
      { input: 'Hello', output: 'No' },
      { input: 'A man a plan a canal Panama', output: 'Yes' },
    ],
  },
  {
    title: 'Fibonacci Sequence',
    contentMd: 'Print the first N terms of the Fibonacci sequence using iteration.',
    ios: [{ input: '7', output: '0 1 1 2 3 5 8' }],
  },
  {
    title: 'Prime Number Check',
    contentMd: 'Check if an integer N is prime. Print "Prime" or "Not Prime".',
    ios: [
      { input: '17', output: 'Prime' },
      { input: '15', output: 'Not Prime' },
    ],
  },
  {
    title: 'GCD of Two Numbers',
    contentMd: "Compute the GCD of two integers using Euclid's algorithm.",
    ios: [
      { input: '48 18', output: '6' },
      { input: '100 25', output: '25' },
    ],
  },
  {
    title: 'Binary Search',
    contentMd: 'Implement binary search on a sorted array. Return the index or -1.',
    ios: [
      { input: '1 3 5 7 9 11\n5', output: '2' },
      { input: '1 3 5 7 9 11\n6', output: '-1' },
    ],
  },
  {
    title: 'Bubble Sort',
    contentMd: 'Implement bubble sort to sort an array in ascending order.',
    ios: [{ input: '64 34 25 12 22 11 90', output: '11 12 22 25 34 64 90' }],
  },
  {
    title: 'Stack Implementation',
    contentMd: 'Implement a stack using arrays with push(), pop(), peek(), isEmpty(), and size() methods.',
    ios: [{ input: 'push 5\npush 10\npop\npeek', output: 'Popped: 10\nTop: 5' }],
  },
  {
    title: 'Queue Implementation',
    contentMd:
      'Implement a circular queue using arrays with enqueue(), dequeue(), front(), rear(), isEmpty(), isFull().',
    ios: [{ input: 'enqueue 1\nenqueue 2\ndequeue\nenqueue 3\nfront', output: 'Dequeued: 1\nFront: 2' }],
  },
  {
    title: 'Singly Linked List Reversal',
    contentMd: 'Given the head of a singly linked list, reverse the list and return its head. Implement iteratively.',
    ios: [{ input: '1 2 3 4 5', output: '5 4 3 2 1' }],
  },
  {
    title: 'Matrix Multiplication',
    contentMd: 'Multiply two matrices A (MxN) and B (NxP). Print the resulting matrix.',
    ios: [{ input: '2 2\n1 2\n3 4\n2 2\n5 6\n7 8', output: '19 22\n43 50' }],
  },
];

const JUBAYER_PROBLEMS: ProblemDef[] = [
  {
    title: 'HTML Table Generator',
    contentMd: 'Generate an HTML table from 2D array data. Include proper thead, tbody, and styling classes.',
    ios: [
      {
        input: '3\nName Age\nAlice 20\nBob 22\nCarol 21',
        output:
          '<table><thead><tr><th>Name</th><th>Age</th></tr></thead><tbody><tr><td>Alice</td><td>20</td></tr><tr><td>Bob</td><td>22</td></tr><tr><td>Carol</td><td>21</td></tr></tbody></table>',
      },
    ],
  },
  {
    title: 'CSS Flexbox Layout',
    contentMd:
      'Write a CSS layout using flexbox that arranges cards in a responsive grid. Cards should wrap and center.',
    ios: [{ input: '4', output: '.container { display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; }' }],
  },
  {
    title: 'DOM Element Manipulation',
    contentMd:
      'Write a JavaScript function that toggles a CSS class on click and updates the inner text of a target element.',
    ios: [{ input: 'toggle dark-mode', output: 'Element class toggled. New state: dark-mode active' }],
  },
  {
    title: 'SQL SELECT Query',
    contentMd:
      'Given a `students` table with columns id, name, gpa, dept, write a query to find top 3 students by GPA from the CS department.',
    ios: [
      {
        input: "SELECT name, gpa FROM students WHERE dept = 'CS' ORDER BY gpa DESC LIMIT 3",
        output: 'Alice 3.9\nBob 3.8\nCarol 3.7',
      },
    ],
  },
  {
    title: 'SQL JOIN Query',
    contentMd:
      'Given `students(id, name)` and `enrollments(id, student_id, course_name)`, write a query to list each student with their enrolled courses.',
    ios: [
      {
        input: 'SELECT s.name, e.course_name FROM students s JOIN enrollments e ON s.id = e.student_id',
        output: 'Alice DBMS\nAlice Web\nBob DBMS',
      },
    ],
  },
  {
    title: 'PHP Form Handling',
    contentMd:
      'Write a PHP script that processes a registration form with validation for email, password (min 8 chars), and confirm password match.',
    ios: [
      { input: 'Email: test@test.com\nPass: secure123\nConfirm: secure123', output: 'Registration successful' },
      { input: 'Email: invalid\nPass: short\nConfirm: mismatch', output: 'Error: Invalid email format' },
    ],
  },
  {
    title: 'REST API: User CRUD',
    contentMd:
      'Design a RESTful API for user management with GET, POST, PUT, DELETE endpoints and proper HTTP status codes.',
    ios: [
      {
        input: 'POST /users {"name":"Alice","email":"alice@test.com"}',
        output: '201 Created\n{"id":1,"name":"Alice"}',
      },
      { input: 'GET /users/1', output: '200 OK\n{"id":1,"name":"Alice","email":"alice@test.com"}' },
    ],
  },
  {
    title: 'Database Normalization',
    contentMd: 'Given an unnormalized table, identify functional dependencies and normalize to 3NF.',
    ios: [
      {
        input: 'Employee(emp_id, emp_name, dept_name, dept_head, project_name, project_hours)',
        output:
          'Employee(emp_id, emp_name)\nDepartment(dept_name, dept_head)\nEmpDept(emp_id, dept_name)\nProject(project_id, project_name)\nAllocation(emp_id, project_id, hours)',
      },
    ],
  },
  {
    title: 'CRUD: Product Inventory',
    contentMd:
      'Implement a product inventory CRUD with create, read (all + single), update stock, and delete product operations.',
    ios: [
      {
        input: 'CREATE Product(name="Laptop", price=1200, stock=10)\nUPDATE stock Laptop +5\nREAD Laptop',
        output: 'Product: Laptop\nPrice: $1200\nStock: 15',
      },
    ],
  },
];

const FYESMIN_PROBLEMS: ProblemDef[] = [
  {
    title: 'Linear Regression',
    contentMd:
      'Implement simple linear regression from scratch. Given X and y arrays, compute slope and intercept using the least squares method.',
    ios: [{ input: 'X: 1 2 3 4 5\ny: 2 4 5 4 5', output: 'Slope: 0.8\nIntercept: 1.6' }],
  },
  {
    title: 'K-Means Clustering',
    contentMd: 'Implement K-Means clustering algorithm. Given 2D points and K, return the final cluster assignments.',
    ios: [
      { input: 'K=2\nPoints: (1,1) (2,1) (4,3) (5,4)', output: 'Cluster 0: (1,1), (2,1)\nCluster 1: (4,3), (5,4)' },
    ],
  },
  {
    title: 'Decision Tree Split',
    contentMd: 'Given a dataset with binary features, compute the best split using Gini impurity.',
    ios: [
      {
        input: 'Feature A: [0,0,1,1]\nFeature B: [0,1,0,1]\nLabels: [0,1,1,0]',
        output: 'Best split: Feature A (Gini=0.5)',
      },
    ],
  },
  {
    title: 'Neural Network: Forward Pass',
    contentMd:
      'Implement a forward pass for a 2-layer neural network with sigmoid activation. Given weights, biases, and input, compute the output.',
    ios: [
      {
        input: 'Input: [0.5, 0.3]\nW1: [[0.2,0.4],[0.1,0.5]]\nb1: [0.1,0.2]\nW2: [[0.3,0.6]]\nb2: [0.1]',
        output: 'Output: 0.687',
      },
    ],
  },
  {
    title: 'Gradient Descent',
    contentMd:
      'Implement gradient descent for a simple quadratic function f(x)=x^2+3x+2. Find the minimum using learning rate 0.1.',
    ios: [{ input: 'learning_rate=0.1, x0=10', output: 'Minimum at x=-1.50 after 50 iterations' }],
  },
  {
    title: 'Confusion Matrix Metrics',
    contentMd:
      'Given true labels and predictions, compute accuracy, precision, recall, and F1-score from the confusion matrix.',
    ios: [{ input: 'TP=50, FP=10, TN=80, FN=5', output: 'Accuracy: 0.90\nPrecision: 0.83\nRecall: 0.91\nF1: 0.87' }],
  },
  {
    title: 'PCA: Dimensionality Reduction',
    contentMd: 'Given a 2D dataset, compute the principal components and reduce the data to 1D.',
    ios: [
      {
        input: 'Points: (2,3) (3,4) (4,5) (5,6) (6,7)',
        output: 'Principal Component: [0.707, 0.707]\nReduced: [-2.828, -1.414, 0, 1.414, 2.828]',
      },
    ],
  },
  {
    title: 'K-Fold Cross Validation',
    contentMd:
      'Implement K-fold cross-validation for a dataset. Split data into K folds, train on K-1 folds, validate on 1 fold, return average accuracy.',
    ios: [
      {
        input: 'K=3\nData: [1,2,3,4,5,6]\nLabels: [0,0,1,1,0,1]',
        output: 'Fold 1: Acc=0.67\nFold 2: Acc=1.00\nFold 3: Acc=0.50\nMean: 0.72',
      },
    ],
  },
];

// ==================== PROBLEM RANGES ====================

const PROBLEM_RANGES = {
  sidratul: { start: 0, count: SIDRATUL_PROBLEMS.length },
  tanvin: { start: SIDRATUL_PROBLEMS.length, count: TANVIN_PROBLEMS.length },
  jubayer: { start: SIDRATUL_PROBLEMS.length + TANVIN_PROBLEMS.length, count: JUBAYER_PROBLEMS.length },
  fyesmin: {
    start: SIDRATUL_PROBLEMS.length + TANVIN_PROBLEMS.length + JUBAYER_PROBLEMS.length,
    count: FYESMIN_PROBLEMS.length,
  },
};

const ALL_PROBLEMS: ProblemDef[] = [...SIDRATUL_PROBLEMS, ...TANVIN_PROBLEMS, ...JUBAYER_PROBLEMS, ...FYESMIN_PROBLEMS];

// ==================== ACTIVITIES ====================

interface ActivityDef {
  sectionIndex: number;
  title: string;
  type: 'class' | 'exam';
  startTimeOffset: number;
  endTimeOffset: number;
  problemRange: { start: number; count: number }; // index range within ALL_PROBLEMS
  problemSubset: number[]; // indices within the range
}

const getActivities = (): ActivityDef[] => [
  // --- Section 0: SPL (Tanvin) ---
  {
    sectionIndex: 0,
    title: 'Lab 01: Variables & Control Flow',
    type: 'class',
    startTimeOffset: -14 * ONE_DAY,
    endTimeOffset: -13 * ONE_DAY,
    problemRange: PROBLEM_RANGES.tanvin,
    problemSubset: [0, 1],
  },
  {
    sectionIndex: 0,
    title: 'Lab 02: Strings & Functions',
    type: 'class',
    startTimeOffset: -7 * ONE_DAY,
    endTimeOffset: -6 * ONE_DAY,
    problemRange: PROBLEM_RANGES.tanvin,
    problemSubset: [2, 3, 4],
  },
  {
    sectionIndex: 0,
    title: 'Lab 03: Arrays & Recursion',
    type: 'class',
    startTimeOffset: -2 * ONE_HOUR,
    endTimeOffset: 3 * ONE_HOUR,
    problemRange: PROBLEM_RANGES.tanvin,
    problemSubset: [6, 7, 11],
  },
  {
    sectionIndex: 0,
    title: 'Midterm Exam',
    type: 'exam',
    startTimeOffset: 2 * ONE_DAY,
    endTimeOffset: 2 * ONE_DAY + 3 * ONE_HOUR,
    problemRange: PROBLEM_RANGES.tanvin,
    problemSubset: [0, 2, 1],
  },

  // --- Section 1: OOP (Sidratul) ---
  {
    sectionIndex: 1,
    title: 'Lab 01: Classes & Objects',
    type: 'class',
    startTimeOffset: -10 * ONE_DAY,
    endTimeOffset: -9 * ONE_DAY,
    problemRange: PROBLEM_RANGES.sidratul,
    problemSubset: [0],
  },
  {
    sectionIndex: 1,
    title: 'Lab 02: Inheritance & Polymorphism',
    type: 'class',
    startTimeOffset: -5 * ONE_DAY,
    endTimeOffset: -4 * ONE_DAY,
    problemRange: PROBLEM_RANGES.sidratul,
    problemSubset: [1, 2],
  },
  {
    sectionIndex: 1,
    title: 'Lab 03: Abstract Classes & Generics',
    type: 'class',
    startTimeOffset: 1 * ONE_DAY + 2 * ONE_HOUR,
    endTimeOffset: 2 * ONE_DAY + 2 * ONE_HOUR,
    problemRange: PROBLEM_RANGES.sidratul,
    problemSubset: [3, 4, 6],
  },
  {
    sectionIndex: 1,
    title: 'Final Exam',
    type: 'exam',
    startTimeOffset: 5 * ONE_DAY,
    endTimeOffset: 5 * ONE_DAY + 3 * ONE_HOUR,
    problemRange: PROBLEM_RANGES.sidratul,
    problemSubset: [0, 2, 5, 7],
  },

  // --- Section 2: DSA I (Tanvin) ---
  {
    sectionIndex: 2,
    title: 'Lab 01: Linked Lists',
    type: 'class',
    startTimeOffset: -8 * ONE_DAY,
    endTimeOffset: -7 * ONE_DAY,
    problemRange: PROBLEM_RANGES.tanvin,
    problemSubset: [10],
  },
  {
    sectionIndex: 2,
    title: 'Lab 02: Stack & Queue',
    type: 'class',
    startTimeOffset: -1 * ONE_HOUR,
    endTimeOffset: 4 * ONE_HOUR,
    problemRange: PROBLEM_RANGES.tanvin,
    problemSubset: [8, 9],
  },
  {
    sectionIndex: 2,
    title: 'Midterm Exam',
    type: 'exam',
    startTimeOffset: 3 * ONE_DAY,
    endTimeOffset: 3 * ONE_DAY + 2 * ONE_HOUR,
    problemRange: PROBLEM_RANGES.tanvin,
    problemSubset: [10, 8, 6],
  },

  // --- Section 3: DSA II (Sidratul) ---
  {
    sectionIndex: 3,
    title: 'Lab 01: Trees & Graphs',
    type: 'class',
    startTimeOffset: -6 * ONE_DAY,
    endTimeOffset: -5 * ONE_DAY,
    problemRange: PROBLEM_RANGES.sidratul,
    problemSubset: [9, 10],
  },
  {
    sectionIndex: 3,
    title: 'Lab 02: Sorting Algorithms',
    type: 'class',
    startTimeOffset: -3 * ONE_DAY,
    endTimeOffset: -2 * ONE_DAY,
    problemRange: PROBLEM_RANGES.sidratul,
    problemSubset: [11, 12],
  },
  {
    sectionIndex: 3,
    title: 'Final Exam',
    type: 'exam',
    startTimeOffset: 7 * ONE_DAY,
    endTimeOffset: 7 * ONE_DAY + 3 * ONE_HOUR,
    problemRange: PROBLEM_RANGES.sidratul,
    problemSubset: [9, 11, 12, 10],
  },

  // --- Section 4: Algorithms (Sidratul) ---
  {
    sectionIndex: 4,
    title: 'Lab 01: Dynamic Programming',
    type: 'class',
    startTimeOffset: -12 * ONE_DAY,
    endTimeOffset: -11 * ONE_DAY,
    problemRange: PROBLEM_RANGES.sidratul,
    problemSubset: [13],
  },
  {
    sectionIndex: 4,
    title: 'Lab 02: Divide & Conquer',
    type: 'class',
    startTimeOffset: -4 * ONE_DAY,
    endTimeOffset: -3 * ONE_DAY,
    problemRange: PROBLEM_RANGES.sidratul,
    problemSubset: [12, 10],
  },
  {
    sectionIndex: 4,
    title: 'Midterm Exam',
    type: 'exam',
    startTimeOffset: 10 * ONE_DAY,
    endTimeOffset: 10 * ONE_DAY + 2 * ONE_HOUR,
    problemRange: PROBLEM_RANGES.sidratul,
    problemSubset: [13, 12, 11],
  },

  // --- Section 5: Web Tech (Jubayer) ---
  {
    sectionIndex: 5,
    title: 'Lab 01: HTML & CSS',
    type: 'class',
    startTimeOffset: -9 * ONE_DAY,
    endTimeOffset: -8 * ONE_DAY,
    problemRange: PROBLEM_RANGES.jubayer,
    problemSubset: [0, 1],
  },
  {
    sectionIndex: 5,
    title: 'Lab 02: JavaScript & DOM',
    type: 'class',
    startTimeOffset: -2 * ONE_DAY,
    endTimeOffset: -1 * ONE_DAY,
    problemRange: PROBLEM_RANGES.jubayer,
    problemSubset: [2],
  },
  {
    sectionIndex: 5,
    title: 'Final Project: Full Stack App',
    type: 'exam',
    startTimeOffset: 4 * ONE_DAY,
    endTimeOffset: 6 * ONE_DAY,
    problemRange: PROBLEM_RANGES.jubayer,
    problemSubset: [6, 8],
  },

  // --- Section 6: Database (Jubayer) ---
  {
    sectionIndex: 6,
    title: 'Lab 01: SQL Basics',
    type: 'class',
    startTimeOffset: -6 * ONE_DAY,
    endTimeOffset: -5 * ONE_DAY,
    problemRange: PROBLEM_RANGES.jubayer,
    problemSubset: [3, 4],
  },
  {
    sectionIndex: 6,
    title: 'Lab 02: PHP & Forms',
    type: 'class',
    startTimeOffset: 1 * ONE_DAY + 2 * ONE_HOUR,
    endTimeOffset: 2 * ONE_DAY,
    problemRange: PROBLEM_RANGES.jubayer,
    problemSubset: [5],
  },
  {
    sectionIndex: 6,
    title: 'Final Exam',
    type: 'exam',
    startTimeOffset: 8 * ONE_DAY,
    endTimeOffset: 8 * ONE_DAY + 2 * ONE_HOUR,
    problemRange: PROBLEM_RANGES.jubayer,
    problemSubset: [3, 4, 7],
  },

  // --- Section 7: ML (Fyesmin) ---
  {
    sectionIndex: 7,
    title: 'Lab 01: Regression & Clustering',
    type: 'class',
    startTimeOffset: -11 * ONE_DAY,
    endTimeOffset: -10 * ONE_DAY,
    problemRange: PROBLEM_RANGES.fyesmin,
    problemSubset: [0, 1],
  },
  {
    sectionIndex: 7,
    title: 'Lab 02: Classification & Neural Nets',
    type: 'class',
    startTimeOffset: 2 * ONE_DAY,
    endTimeOffset: 3 * ONE_DAY,
    problemRange: PROBLEM_RANGES.fyesmin,
    problemSubset: [2, 3],
  },
  {
    sectionIndex: 7,
    title: 'Final Exam',
    type: 'exam',
    startTimeOffset: 14 * ONE_DAY,
    endTimeOffset: 14 * ONE_DAY + 3 * ONE_HOUR,
    problemRange: PROBLEM_RANGES.fyesmin,
    problemSubset: [0, 2, 5, 6],
  },
];

// ==================== SNAPSHOT / SUBMISSION DATA ====================

const SNAP_SUM = [
  `a, b = map(int, input().split())\n`,
  `a, b = map(int, input().split())\nresult = a + b\n`,
  `a, b = map(int, input().split())\nresult = a + b\nprint(result)\n`,
];

const SNAP_REV = [
  `class Node:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n`,
  `class Node:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef reverse(head):\n    prev = None\n    curr = head\n`,
  `class Node:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef reverse(head):\n    prev = None\n    curr = head\n    while curr:\n        nxt = curr.next\n        curr.next = prev\n        prev = curr\n        curr = nxt\n    return prev\n`,
];

const SNAP_BANK = [
  `class BankAccount:\n    pass\n`,
  `class BankAccount:\n    def __init__(self, acc_id, balance=0):\n        self.acc_id = acc_id\n        self.balance = balance\n`,
  `class BankAccount:\n    def __init__(self, acc_id, balance=0):\n        self.acc_id = acc_id\n        self.balance = balance\n    \n    def deposit(self, amount):\n        self.balance += amount\n    \n    def withdraw(self, amount):\n        if amount > self.balance:\n            raise ValueError("Insufficient funds")\n        self.balance -= amount\n`,
];

const SNAP_BINSEARCH = [
  'def binary_search(arr, target):\n    # implement binary search\n    pass\n',
  'def binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1\n',
  'def binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1\n\n# test\narr = [1, 3, 5, 7, 9, 11]\nidx = binary_search(arr, 7)\nprint(f"Found at index {idx}")\n',
];

// ==================== SOCIAL DATA ====================

const TAG_NAMES = ['Python', 'Help', 'OOP', 'C', 'Data Structures', 'Algorithms'];

const POST_DEFS = [
  {
    authorIdx: 6, // rhasan
    title: 'Recursion limits in Python',
    contentMd:
      'Is it okay to use recursion for the factorial problem? Will it hit stack limits for large N? I tried with N=1000 and got a RecursionError.',
    tagIndices: [0, 1], // Python, Help
  },
  {
    authorIdx: 5, // ffaisal
    title: 'Understanding Polymorphism in Java',
    contentMd:
      'Can someone explain runtime polymorphism with a practical example? I understand method overriding but how does the JVM decide which method to call at runtime?',
    tagIndices: [2], // OOP
  },
  {
    authorIdx: 2, // Tanvin
    title: 'Binary Search Tree Implementation Guide',
    contentMd:
      'Here is a comprehensive guide to implementing BST in C. We cover insertion, deletion (all 3 cases), traversal (inorder, preorder, postorder), and searching with time complexity analysis.',
    tagIndices: [4, 3], // Data Structures, C
  },
];

const COMMENT_DEFS = [
  {
    postIdx: 0,
    authorIdx: 2, // Tanvin
    content:
      'For N=100, recursion is fine. For larger values, you might need to increase the recursion limit using sys.setrecursionlimit() or use an iterative approach.',
  },
  {
    postIdx: 1,
    authorIdx: 1, // Sidratul
    content:
      'Great question! Runtime polymorphism in Java uses a vtable (virtual method table). Each class has a vtable that maps method calls to actual implementations. When you call an overridden method through a base class reference, the JVM looks up the vtable to find the correct implementation based on the actual object type at runtime.',
  },
  {
    postIdx: 1,
    authorIdx: 5, // ffaisal (reply to Sidratul)
    content:
      "Thank you, ma'am! That makes sense. So the vtable is created at compile time but the dispatch happens at runtime. I understand now.",
    parentCommentIdx: 1, // replies to the above comment
  },
  {
    postIdx: 2,
    authorIdx: 6, // rhasan
    content:
      'Thank you, sir! This guide is very helpful. The deletion section with successor replacement was what I was stuck on.',
  },
];

// ==================== SUBMISSION QUEUE ====================

interface SubmissionDef {
  authorIdx: number;
  activityIdx: number;
  problemSubIdx: number; // index within that activity's problemSubset
  verdict: string;
  timeOffset: number;
  content: string;
  hasSnapshots?: boolean;
  snapshotSteps?: string[];
}

// Time offsets spread over ~7 days for dashboard trend
const T = (hoursAgo: number) => -hoursAgo * ONE_HOUR;

const SUBMISSION_DEFS: SubmissionDef[] = [
  // ffaisal submissions
  {
    authorIdx: 5,
    activityIdx: 0,
    problemSubIdx: 0,
    verdict: 'Accepted',
    timeOffset: T(160),
    content: SNAP_SUM[2],
    hasSnapshots: true,
    snapshotSteps: SNAP_SUM,
  },
  {
    authorIdx: 5,
    activityIdx: 0,
    problemSubIdx: 1,
    verdict: 'Accepted',
    timeOffset: T(155),
    content: 'n = int(input())\nresult = 1\nfor i in range(2, n + 1):\n    result *= i\nprint(result)\n',
  },
  {
    authorIdx: 5,
    activityIdx: 4,
    problemSubIdx: 0,
    verdict: 'Accepted',
    timeOffset: T(100),
    content: SNAP_BANK[2],
    hasSnapshots: true,
    snapshotSteps: SNAP_BANK,
  },
  {
    authorIdx: 5,
    activityIdx: 1,
    problemSubIdx: 0,
    verdict: 'Wrong Answer',
    timeOffset: T(60),
    content: 's = input().strip()\nif s == s[::-1]:\n    print("Yes")\nelse:\n    print("No")\n',
  },
  {
    authorIdx: 5,
    activityIdx: 8,
    problemSubIdx: 0,
    verdict: 'Accepted',
    timeOffset: T(30),
    content: SNAP_REV[2],
    hasSnapshots: true,
    snapshotSteps: SNAP_REV,
  },
  {
    authorIdx: 5,
    activityIdx: 17,
    problemSubIdx: 0,
    verdict: 'Accepted',
    timeOffset: T(4),
    content: '<table><tr><th>Name</th><th>Age</th></tr><tr><td>Alice</td><td>20</td></tr></table>\n',
  },

  // rhasan submissions
  { authorIdx: 6, activityIdx: 4, problemSubIdx: 0, verdict: 'Accepted', timeOffset: T(120), content: SNAP_BANK[2] },
  {
    authorIdx: 6,
    activityIdx: 0,
    problemSubIdx: 0,
    verdict: 'Wrong Answer',
    timeOffset: T(110),
    content: 'a, b = input().split()\nprint(int(a) - int(b))\n',
    hasSnapshots: true,
    snapshotSteps: ['print("hello")\n'],
  },
  {
    authorIdx: 6,
    activityIdx: 11,
    problemSubIdx: 0,
    verdict: 'Accepted',
    timeOffset: T(72),
    content:
      'class TreeNode:\n    def __init__(self, val):\n        self.val = val\n        self.left = None\n        self.right = None\n\ndef inorder(root):\n    if not root:\n        return []\n    return inorder(root.left) + [root.val] + inorder(root.right)\n',
  },
  {
    authorIdx: 6,
    activityIdx: 14,
    problemSubIdx: 0,
    verdict: 'Accepted',
    timeOffset: T(48),
    content:
      'def fib(n):\n    if n <= 1:\n        return n\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b\n',
  },
  {
    authorIdx: 6,
    activityIdx: 20,
    problemSubIdx: 0,
    verdict: 'Wrong Answer',
    timeOffset: T(12),
    content: 'SELECT * FROM students ORDER BY gpa;\n',
  },

  // ffaisal submissions for Lab 03: Arrays & Recursion (active)
  {
    authorIdx: 5,
    activityIdx: 2,
    problemSubIdx: 0,
    verdict: 'Accepted',
    timeOffset: T(12),
    content:
      'def binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1\n',
    hasSnapshots: true,
    snapshotSteps: SNAP_BINSEARCH,
  },
  {
    authorIdx: 5,
    activityIdx: 2,
    problemSubIdx: 1,
    verdict: 'Accepted',
    timeOffset: T(8),
    content:
      'def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr\n',
  },
  // ffaisal & rhasan for DSA I Lab 02: Stack & Queue (active)
  {
    authorIdx: 5,
    activityIdx: 9,
    problemSubIdx: 0,
    verdict: 'Accepted',
    timeOffset: T(20),
    content:
      'class Stack:\n    def __init__(self):\n        self.items = []\n    def push(self, x):\n        self.items.append(x)\n    def pop(self):\n        return self.items.pop() if self.items else None\n    def peek(self):\n        return self.items[-1] if self.items else None\n    def is_empty(self):\n        return len(self.items) == 0\n',
  },
  {
    authorIdx: 5,
    activityIdx: 9,
    problemSubIdx: 1,
    verdict: 'Accepted',
    timeOffset: T(16),
    content:
      'class Queue:\n    def __init__(self):\n        self.items = []\n    def enqueue(self, x):\n        self.items.append(x)\n    def dequeue(self):\n        return self.items.pop(0) if self.items else None\n    def front(self):\n        return self.items[0] if self.items else None\n    def is_empty(self):\n        return len(self.items) == 0\n',
  },
  {
    authorIdx: 6,
    activityIdx: 9,
    problemSubIdx: 0,
    verdict: 'Accepted',
    timeOffset: T(14),
    content:
      'class Stack:\n    def __init__(self):\n        self.items = []\n    def push(self, x):\n        self.items.append(x)\n    def pop(self):\n        return self.items.pop() if self.items else None\n',
  },
  // ffaisal & rhasan for DSA I Midterm (upcoming)
  {
    authorIdx: 5,
    activityIdx: 10,
    problemSubIdx: 0,
    verdict: 'Accepted',
    timeOffset: T(100),
    content: SNAP_REV[2],
  },
  {
    authorIdx: 5,
    activityIdx: 10,
    problemSubIdx: 1,
    verdict: 'Accepted',
    timeOffset: T(96),
    content:
      'class Stack:\n    def __init__(self):\n        self.items = []\n    def push(self, x):\n        self.items.append(x)\n    def pop(self):\n        return self.items.pop() if self.items else None\n    def peek(self):\n        return self.items[-1] if self.items else None\n    def is_empty(self):\n        return len(self.items) == 0\n',
  },
  {
    authorIdx: 6,
    activityIdx: 10,
    problemSubIdx: 2,
    verdict: 'Accepted',
    timeOffset: T(90),
    content:
      'def binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1\n',
  },
  // rhasan for DSA I Lab 01: Linked Lists
  {
    authorIdx: 6,
    activityIdx: 8,
    problemSubIdx: 0,
    verdict: 'Accepted',
    timeOffset: T(144),
    content: SNAP_REV[2],
  },
  // Extra dummy submissions for Lab 03, Midterm, DSA I activities
  {
    authorIdx: 7,
    activityIdx: 2,
    problemSubIdx: 0,
    verdict: 'Wrong Answer',
    timeOffset: T(14),
    content:
      'def search(arr, target):\n    for i, v in enumerate(arr):\n        if v == target:\n            return i\n    return -1\n',
  },
  {
    authorIdx: 8,
    activityIdx: 2,
    problemSubIdx: 2,
    verdict: 'Accepted',
    timeOffset: T(6),
    content:
      'def mat_mul(A, B):\n    m = len(A)\n    n = len(A[0])\n    p = len(B[0])\n    C = [[0] * p for _ in range(m)]\n    for i in range(m):\n        for j in range(p):\n            for k in range(n):\n                C[i][j] += A[i][k] * B[k][j]\n    return C\n',
  },
  {
    authorIdx: 9,
    activityIdx: 2,
    problemSubIdx: 1,
    verdict: 'Accepted',
    timeOffset: T(4),
    content:
      'def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr\n',
  },
  {
    authorIdx: 10,
    activityIdx: 3,
    problemSubIdx: 1,
    verdict: 'Accepted',
    timeOffset: T(48),
    content: 'n = int(input())\nresult = 1\nfor i in range(2, n + 1):\n    result *= i\nprint(result)\n',
  },
  {
    authorIdx: 11,
    activityIdx: 3,
    problemSubIdx: 2,
    verdict: 'Wrong Answer',
    timeOffset: T(36),
    content: 's = input().strip()\nprint("Yes" if s == s[::-1] else "No")\n',
  },
  {
    authorIdx: 21,
    activityIdx: 8,
    problemSubIdx: 0,
    verdict: 'Wrong Answer',
    timeOffset: T(120),
    content: 'def reverse(head):\n    # incomplete\n    pass\n',
  },
  {
    authorIdx: 22,
    activityIdx: 10,
    problemSubIdx: 0,
    verdict: 'Accepted',
    timeOffset: T(84),
    content:
      'class Node:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef reverse(head):\n    prev = None\n    curr = head\n    while curr:\n        nxt = curr.next\n        curr.next = prev\n        prev = curr\n        curr = nxt\n    return prev\n',
  },
  {
    authorIdx: 13,
    activityIdx: 10,
    problemSubIdx: 1,
    verdict: 'Wrong Answer',
    timeOffset: T(78),
    content:
      'class Stack:\n    def __init__(self):\n        self.items = []\n    def push(self, x):\n        self.items.append(x)\n    def pop(self):\n        if self.items:\n            return self.items.pop()\n',
  },
  {
    authorIdx: 12,
    activityIdx: 10,
    problemSubIdx: 2,
    verdict: 'Accepted',
    timeOffset: T(72),
    content:
      'def binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1\n',
  },

  // Dummy submissions for dashboard stats
  {
    authorIdx: 7,
    activityIdx: 0,
    problemSubIdx: 0,
    verdict: 'Accepted',
    timeOffset: T(140),
    content: 'a, b = map(int, input().split())\nprint(a + b)\n',
  },
  {
    authorIdx: 8,
    activityIdx: 0,
    problemSubIdx: 0,
    verdict: 'Accepted',
    timeOffset: T(130),
    content: 'a, b = map(int, input().split())\nprint(a + b)\n',
  },
  {
    authorIdx: 9,
    activityIdx: 0,
    problemSubIdx: 1,
    verdict: 'Wrong Answer',
    timeOffset: T(90),
    content: 'n = int(input())\nprint(n * 2)\n',
  },
  { authorIdx: 16, activityIdx: 4, problemSubIdx: 0, verdict: 'Accepted', timeOffset: T(80), content: SNAP_BANK[2] },
  {
    authorIdx: 11,
    activityIdx: 1,
    problemSubIdx: 1,
    verdict: 'Accepted',
    timeOffset: T(50),
    content: 'def fib(n):\n    if n <= 1:\n        return n\n    return fib(n-1) + fib(n-2)\n',
  },
  {
    authorIdx: 21,
    activityIdx: 8,
    problemSubIdx: 0,
    verdict: 'Pending',
    timeOffset: T(24),
    content: 'def reverse(head):\n    # incomplete\n    pass\n',
  },
  {
    authorIdx: 13,
    activityIdx: 17,
    problemSubIdx: 0,
    verdict: 'Accepted',
    timeOffset: T(8),
    content: '<table><tr><td>test</td></tr></table>\n',
  },
  {
    authorIdx: 14,
    activityIdx: 11,
    problemSubIdx: 1,
    verdict: 'Wrong Answer',
    timeOffset: T(6),
    content:
      'def dfs(graph, start):\n    visited = set()\n    stack = [start]\n    while stack:\n        v = stack.pop()\n        if v not in visited:\n            visited.add(v)\n            stack.extend(graph[v] - visited)\n    return visited\n',
  },
  {
    authorIdx: 15,
    activityIdx: 20,
    problemSubIdx: 0,
    verdict: 'Accepted',
    timeOffset: T(3),
    content:
      'def linear_regression(X, y):\n    n = len(X)\n    x_mean = sum(X) / n\n    y_mean = sum(y) / n\n    num = sum((X[i] - x_mean) * (y[i] - y_mean) for i in range(n))\n    den = sum((X[i] - x_mean) ** 2 for i in range(n))\n    slope = num / den\n    intercept = y_mean - slope * x_mean\n    return slope, intercept\n',
  },
];

// ==================== HANDLER ====================

export default internalMutation({
  args: {},
  handler: async (ctx) => {
    const NOW = Date.now();
    const ACTIVITIES = getActivities();

    // 1. WIPE ALL TABLES
    console.log('Wiping all tables...');
    for (const table of TABLES) {
      const docs = await ctx.db.query(table as TableNames).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
    }

    // 2. USERS
    console.log('Seeding users...');
    const userIds: Id<'users'>[] = [];
    for (let ui = 0; ui < ALL_USERS.length; ui++) {
      const u = ALL_USERS[ui];
      const createdAt = NOW - (ALL_USERS.length - ui) * ONE_DAY;
      const id = await ctx.db.insert('users', {
        name: u.name,
        email: u.email,
        passwordHash: DEFAULT_PASS,
        role: u.role,
        aboutMd: (u as any).aboutMd ?? undefined,
        avatarUrl: avatar(u.email),
        createdAt,
        updatedAt: createdAt,
      });
      userIds.push(id);
    }

    // 3. SECTIONS
    console.log('Seeding sections...');
    const sectionIds: Id<'sections'>[] = [];
    const sectionStudentIndices: number[][] = []; // for tracking enrollments

    for (let si = 0; si < SECTION_CONFIGS.length; si++) {
      const cfg = SECTION_CONFIGS[si];
      const sectionCreatedAt = NOW - (SECTION_CONFIGS.length - si) * 2 * ONE_DAY;
      const sectionId = await ctx.db.insert('sections', {
        name: cfg.name,
        aboutMd: cfg.aboutMd,
        createdAt: sectionCreatedAt,
        updatedAt: sectionCreatedAt,
      });
      sectionIds.push(sectionId);

      // Teachers
      for (const tIdx of cfg.teacherIndices) {
        await ctx.db.insert('sectionTeachers', { sectionId, teacherId: userIds[tIdx], createdAt: sectionCreatedAt });
      }

      // Students: main + dummies
      const dummyIndices = getUniqueDummies(si, DUMMY_STUDENTS.length, cfg.dummyCount);
      const allStudentIndices = [...cfg.mainStudentIndices, ...dummyIndices.map((d) => 7 + d)];
      sectionStudentIndices.push(allStudentIndices);

      for (const sIdx of allStudentIndices) {
        await ctx.db.insert('sectionStudents', { sectionId, studentId: userIds[sIdx], createdAt: sectionCreatedAt });
      }
    }

    // 4. PROBLEMS & IOS
    console.log('Seeding problems...');
    const problemCreators = [
      ...SIDRATUL_PROBLEMS.map(() => 1), // Sidratul
      ...TANVIN_PROBLEMS.map(() => 2), // Tanvin
      ...JUBAYER_PROBLEMS.map(() => 3), // Jubayer
      ...FYESMIN_PROBLEMS.map(() => 4), // Fyesmin
    ];

    const problemIds: Id<'problems'>[] = [];
    for (let pi = 0; pi < ALL_PROBLEMS.length; pi++) {
      const p = ALL_PROBLEMS[pi];
      const problemCreatedAt = NOW - (ALL_PROBLEMS.length - pi) * 1.5 * ONE_DAY;
      const problemId = await ctx.db.insert('problems', {
        title: p.title,
        contentMd: p.contentMd,
        createdBy: userIds[problemCreators[pi]],
        createdAt: problemCreatedAt,
        updatedAt: problemCreatedAt,
      });
      problemIds.push(problemId);

      for (let ioIdx = 0; ioIdx < p.ios.length; ioIdx++) {
        await ctx.db.insert('problemIos', {
          problemId,
          inputData: p.ios[ioIdx].input,
          outputData: p.ios[ioIdx].output,
          ioOrder: ioIdx,
        });
      }
    }

    // 5. ACTIVITIES & PROBLEM JOIN
    console.log('Seeding activities...');
    const activityIds: Id<'activities'>[] = [];
    for (let ai = 0; ai < ACTIVITIES.length; ai++) {
      const a = ACTIVITIES[ai];
      const activityCreatedAt = NOW - (ACTIVITIES.length - ai) * ONE_DAY;
      const activityId = await ctx.db.insert('activities', {
        sectionId: sectionIds[a.sectionIndex],
        title: a.title,
        startTime: NOW + a.startTimeOffset,
        endTime: NOW + a.endTimeOffset,
        type: a.type,
        createdAt: activityCreatedAt,
        updatedAt: activityCreatedAt,
      });
      activityIds.push(activityId);

      for (let o = 0; o < a.problemSubset.length; o++) {
        const globalIdx = a.problemRange.start + a.problemSubset[o];
        await ctx.db.insert('activityProblems', {
          activityId,
          problemId: problemIds[globalIdx],
          problemOrder: o,
          createdAt: activityCreatedAt,
        });
      }
    }

    // 6. SNAPSHOTS & SUBMISSIONS
    console.log('Seeding snapshots and submissions...');

    // Snapshots from highlighted students
    for (const subDef of SUBMISSION_DEFS) {
      if (!subDef.hasSnapshots || !subDef.snapshotSteps) continue;

      const act = ACTIVITIES[subDef.activityIdx];
      const problemGlobalIdx = act.problemRange.start + act.problemSubset[subDef.problemSubIdx];
      const steps = subDef.snapshotSteps;
      const baseTime = NOW + subDef.timeOffset;

      for (let si2 = 0; si2 < steps.length; si2++) {
        await ctx.db.insert('snapshots', {
          authorId: userIds[subDef.authorIdx],
          activityId: activityIds[subDef.activityIdx],
          problemId: problemIds[problemGlobalIdx],
          content: steps[si2],
          languageId: 71,
          timestamp: baseTime - (steps.length - si2) * 5 * 60000,
        });
      }
    }

    // Extra dummy snapshots
    const dummySnapshots = [
      { authorIdx: 9, activityIdx: 0, problemSubIdx: 0, step: 'print("test")\n' },
      {
        authorIdx: 11,
        activityIdx: 1,
        problemSubIdx: 1,
        step: 'def fib(n): return n if n <= 1 else fib(n-1) + fib(n-2)\n',
      },
      { authorIdx: 16, activityIdx: 8, problemSubIdx: 0, step: '# working on reversal\n' },
      { authorIdx: 18, activityIdx: 11, problemSubIdx: 0, step: 'class TreeNode:\n    pass\n' },
      { authorIdx: 7, activityIdx: 2, problemSubIdx: 0, step: '# trying binary search\n' },
      { authorIdx: 8, activityIdx: 2, problemSubIdx: 2, step: 'def mat_mul(A, B):\n    # TODO\n    pass\n' },
    ];

    for (const ds of dummySnapshots) {
      const act = ACTIVITIES[ds.activityIdx];
      const problemGlobalIdx = act.problemRange.start + act.problemSubset[ds.problemSubIdx];
      await ctx.db.insert('snapshots', {
        authorId: userIds[ds.authorIdx],
        activityId: activityIds[ds.activityIdx],
        problemId: problemIds[problemGlobalIdx],
        content: ds.step,
        languageId: 71,
        timestamp: NOW - 2 * ONE_HOUR,
      });
    }

    // All submissions
    for (const subDef of SUBMISSION_DEFS) {
      const act = ACTIVITIES[subDef.activityIdx];
      const problemGlobalIdx = act.problemRange.start + act.problemSubset[subDef.problemSubIdx];
      await ctx.db.insert('submissions', {
        authorId: userIds[subDef.authorIdx],
        activityId: activityIds[subDef.activityIdx],
        problemId: problemIds[problemGlobalIdx],
        content: subDef.content,
        languageId: 71,
        judgeVerdict: subDef.verdict === 'Pending' ? undefined : subDef.verdict,
        submittedAt: NOW + subDef.timeOffset,
      });
    }

    // 7. SOCIAL DATA
    console.log('Seeding social data...');

    // Tags
    const tagIds: Id<'tags'>[] = [];
    for (const tagName of TAG_NAMES) {
      tagIds.push(await ctx.db.insert('tags', { name: tagName }));
    }

    // Posts
    const postIds: Id<'posts'>[] = [];
    for (const pd of POST_DEFS) {
      const postId = await ctx.db.insert('posts', {
        authorId: userIds[pd.authorIdx],
        title: pd.title,
        contentMd: pd.contentMd,
        score: 1,
        createdAt: NOW - 2 * ONE_HOUR * (POST_DEFS.indexOf(pd) + 1),
        updatedAt: NOW - 2 * ONE_HOUR * (POST_DEFS.indexOf(pd) + 1),
      });
      postIds.push(postId);

      // Post tags
      for (const tagIdx of pd.tagIndices) {
        await ctx.db.insert('postTags', { postId, tagId: tagIds[tagIdx] });
      }

      // Auto upvote
      await ctx.db.insert('postVotes', { postId, userId: userIds[pd.authorIdx], value: 1 });
    }

    // Additional post votes from other users
    const extraPostVotes: { postIdx: number; voterIdx: number; value: 1 | -1 }[] = [
      { postIdx: 0, voterIdx: 2, value: 1 }, // Tanvin upvotes recursion post
      { postIdx: 0, voterIdx: 1, value: 1 }, // Sidratul upvotes
      { postIdx: 0, voterIdx: 5, value: 1 }, // ffaisal upvotes
      { postIdx: 1, voterIdx: 1, value: 1 }, // Sidratul upvotes polymorphism post
      { postIdx: 1, voterIdx: 6, value: 1 }, // rhasan upvotes
      { postIdx: 1, voterIdx: 2, value: 1 }, // Tanvin upvotes
      { postIdx: 2, voterIdx: 1, value: 1 }, // Sidratul upvotes BST guide
      { postIdx: 2, voterIdx: 5, value: 1 }, // ffaisal upvotes
      { postIdx: 2, voterIdx: 6, value: 1 }, // rhasan upvotes
    ];
    for (const v of extraPostVotes) {
      await ctx.db.insert('postVotes', { postId: postIds[v.postIdx], userId: userIds[v.voterIdx], value: v.value });
    }

    // Recalculate post scores
    const postScores = [3, 4, 4]; // self + extra votes
    for (let pi = 0; pi < postIds.length; pi++) {
      await ctx.db.patch(postIds[pi], { score: postScores[pi] });
    }

    // Comments
    const commentIds: Id<'comments'>[] = [];
    for (const cd of COMMENT_DEFS) {
      const now = NOW - ONE_HOUR * (COMMENT_DEFS.indexOf(cd) + 1);
      const commentId = await ctx.db.insert('comments', {
        authorId: userIds[cd.authorIdx],
        postId: postIds[cd.postIdx],
        parentCommentId: cd.parentCommentIdx !== undefined ? commentIds[cd.parentCommentIdx] : undefined,
        content: cd.content,
        score: 1,
        createdAt: now,
        updatedAt: now,
      });
      commentIds.push(commentId);

      // Auto upvote
      await ctx.db.insert('commentVotes', { commentId, userId: userIds[cd.authorIdx], value: 1 });
    }

    // Additional comment votes
    const extraCommentVotes: { commentIdx: number; voterIdx: number; value: 1 | -1 }[] = [
      { commentIdx: 0, voterIdx: 5, value: 1 }, // ffaisal upvotes Tanvin's answer
      { commentIdx: 0, voterIdx: 6, value: 1 }, // rhasan upvotes
      { commentIdx: 1, voterIdx: 5, value: 1 }, // ffaisal upvotes Sidratul's explanation
      { commentIdx: 1, voterIdx: 6, value: 1 }, // rhasan upvotes
      { commentIdx: 3, voterIdx: 2, value: 1 }, // Tanvin upvotes rhasan's thanks
    ];
    for (const v of extraCommentVotes) {
      await ctx.db.insert('commentVotes', {
        commentId: commentIds[v.commentIdx],
        userId: userIds[v.voterIdx],
        value: v.value,
      });
    }

    // Recalculate comment scores
    const commentScores = [3, 3, 1, 2]; // self + extra votes
    for (let ci = 0; ci < commentIds.length; ci++) {
      await ctx.db.patch(commentIds[ci], { score: commentScores[ci] });
    }

    // 8. CHAT - SPL Support
    console.log('Seeding chats...');
    const splChatId = await ctx.db.insert('chats', { name: 'CSE 1111 - SPL Support', createdAt: NOW });

    const splChatMembers = [2, 5, 6, 7]; // Tanvin, ffaisal, rhasan, Sadia
    for (const mIdx of splChatMembers) {
      await ctx.db.insert('chatMembers', { chatId: splChatId, userId: userIds[mIdx], joinedAt: NOW });
    }

    const splMessages: { senderIdx: number; content: string; offset: number }[] = [
      { senderIdx: 2, content: 'Welcome to the SPL support group! Ask your questions here.', offset: -24 },
      { senderIdx: 5, content: 'Thanks sir! I had a question about the Lab 01 assignment...', offset: -23 },
      { senderIdx: 6, content: 'Same here, the recursion problem was tricky.', offset: -22 },
      {
        senderIdx: 5,
        content: "Can someone help me with Lab 03? I'm stuck on binary search implementation.",
        offset: -20,
      },
      {
        senderIdx: 2,
        content: 'Sure Faisal! The key insight is that you need a sorted array first for binary search.',
        offset: -19,
      },
      { senderIdx: 5, content: 'Ah I see, so I need to sort before searching? That makes sense.', offset: -18 },
      {
        senderIdx: 2,
        content: 'Exactly. Binary search only works on sorted data. Bubble sort first, then search.',
        offset: -17,
      },
      {
        senderIdx: 6,
        content: 'That helped me too! I was trying to binary search on an unsorted array earlier.',
        offset: -15,
      },
      { senderIdx: 7, content: "Same question here! The lab instructions weren't clear about that part.", offset: -14 },
      {
        senderIdx: 2,
        content: 'Check the lecture slides from Week 4 - they have examples of bubble sort followed by binary search.',
        offset: -12,
      },
      { senderIdx: 5, content: 'Got it working now! Thanks everyone! 🔥', offset: -10 },
      { senderIdx: 6, content: 'Same here. Passing all test cases now.', offset: -8 },
    ];

    for (const msg of splMessages) {
      await ctx.db.insert('messages', {
        chatId: splChatId,
        senderId: userIds[msg.senderIdx],
        content: msg.content,
        sentAt: NOW + msg.offset * ONE_HOUR,
      });
    }

    // OOP Study Group chat
    const oopChatId = await ctx.db.insert('chats', { name: 'CSE 1115 - OOP Study Group', createdAt: NOW });

    const oopChatMembers = [1, 5, 6, 16, 22, 25]; // Sidratul, ffaisal, rhasan + dummies
    for (const mIdx of oopChatMembers) {
      await ctx.db.insert('chatMembers', { chatId: oopChatId, userId: userIds[mIdx], joinedAt: NOW });
    }

    const oopMessages: { senderIdx: number; content: string; offset: number }[] = [
      {
        senderIdx: 5,
        content: "Ma'am, can you explain the difference between abstract classes and interfaces?",
        offset: -48,
      },
      {
        senderIdx: 1,
        content:
          'Great question! An abstract class can have both abstract and concrete methods, while an interface (pre-Java 8) only has abstract method signatures.',
        offset: -47,
      },
      { senderIdx: 6, content: 'So when should I use one over the other?', offset: -46 },
      {
        senderIdx: 1,
        content:
          'Use abstract classes for closely related classes that share state. Use interfaces for unrelated classes that share capabilities.',
        offset: -45,
      },
      { senderIdx: 5, content: "That clears it up. Thank you ma'am!", offset: -44 },
      { senderIdx: 16, content: 'I have a question about the Lab 03 generic pair class...', offset: -24 },
      { senderIdx: 1, content: 'Sure Farzana, what specifically are you confused about?', offset: -23 },
      { senderIdx: 16, content: 'How does the swap() method work with generic types?', offset: -22 },
      {
        senderIdx: 1,
        content:
          'Generic swap is straightforward - it just exchanges the two values regardless of their types. The compiler handles type safety.',
        offset: -21,
      },
      { senderIdx: 5, content: 'I can share my solution if you want to see it in action.', offset: -20 },
      { senderIdx: 22, content: "Could you share it with me too? I'm stuck on the same part.", offset: -18 },
    ];

    for (const msg of oopMessages) {
      await ctx.db.insert('messages', {
        chatId: oopChatId,
        senderId: userIds[msg.senderIdx],
        content: msg.content,
        sentAt: NOW + msg.offset * ONE_HOUR,
      });
    }

    console.log('Seed complete!');
  },
});
