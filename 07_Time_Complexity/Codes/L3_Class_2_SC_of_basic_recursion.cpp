#include <iostream>
using namespace std;

int depth = 0, maxDepth = 0;

int sumTo(int n) {
    depth++;
    if (depth > maxDepth) maxDepth = depth;

    int result;
    if (n == 0) result = 0;
    else result = n + sumTo(n - 1);

    depth--;
    return result;
}

int main() {
    int n = 4;
    int total = sumTo(n);

    cout << "Sum 1 to " << n << " = " << total << endl;
    cout << "Deepest point: " << maxDepth << " calls waiting on the stack" << endl;
    cout << "Stack grows with N, so SC = O(N)" << endl;
    return 0;
}
