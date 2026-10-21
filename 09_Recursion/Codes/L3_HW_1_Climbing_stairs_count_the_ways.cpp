#include <iostream>
using namespace std;

// Ways to climb n stairs taking 1 or 2 steps at a time
int countWays(int n) {
    if (n == 0) return 1;     // reached the top exactly: 1 way
    if (n < 0) return 0;      // jumped past the top: not a valid way
    return countWays(n - 1) + countWays(n - 2);
}

int main() {
    for (int n = 1; n <= 6; n++) {
        cout << "Stairs = " << n << " -> " << countWays(n) << " ways" << endl;
    }
    return 0;
}
