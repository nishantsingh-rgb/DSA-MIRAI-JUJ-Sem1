#include <iostream>
using namespace std;

long long factorial(int n) {
    cout << "Called factorial(" << n << ")" << endl;
    if (n <= 1) {                                // base case
        cout << "Base case: factorial(" << n << ") returns 1" << endl;
        return 1;
    }
    long long result = n * factorial(n - 1);     // recursive case
    cout << "factorial(" << n << ") returns " << result << endl;
    return result;
}

int main() {
    int n = 5;
    long long answer = factorial(n);
    cout << n << "! = " << answer << endl;
    return 0;
}
