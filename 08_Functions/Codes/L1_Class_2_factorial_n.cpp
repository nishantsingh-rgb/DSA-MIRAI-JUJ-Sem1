#include <iostream>
using namespace std;

long long factorial(int n);   // declaration (prototype)

int main() {
    for (int i = 0; i <= 5; i++) {
        cout << i << "! = " << factorial(i) << endl;
    }
    return 0;
}

long long factorial(int n) {   // definition
    long long result = 1;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}
