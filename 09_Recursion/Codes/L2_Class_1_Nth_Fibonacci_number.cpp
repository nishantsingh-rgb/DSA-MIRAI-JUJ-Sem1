#include <iostream>
using namespace std;

// Prints every call, indented by its depth, to draw the recursion tree.
int fibTree(int n, int depth) {
    for (int i = 0; i < depth; i++) cout << "    ";
    cout << "fib(" << n << ")" << endl;
    if (n <= 1) return n;
    return fibTree(n - 1, depth + 1) + fibTree(n - 2, depth + 1);
}

int fib(int n) {
    if (n <= 1) return n;                 // fib(0) = 0, fib(1) = 1
    return fib(n - 1) + fib(n - 2);       // two recursive calls
}

int main() {
    cout << "Recursion tree for fib(4):" << endl;
    int ans = fibTree(4, 0);
    cout << "fib(4) = " << ans << endl;

    cout << "First 10 Fibonacci numbers: ";
    for (int i = 0; i < 10; i++) {
        cout << fib(i) << " ";
    }
    cout << endl;
    return 0;
}
