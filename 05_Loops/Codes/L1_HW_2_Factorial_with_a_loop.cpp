#include <iostream>
using namespace std;

int main() {
    int n = 6;
    long long factorial = 1;

    for (int i = 1; i <= n; i++) {
        factorial *= i;
    }

    cout << n << "! = " << factorial << endl;
    return 0;
}
