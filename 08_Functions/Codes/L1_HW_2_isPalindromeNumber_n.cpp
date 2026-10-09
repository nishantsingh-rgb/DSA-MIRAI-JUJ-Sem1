#include <iostream>
using namespace std;

bool isPalindromeNumber(int n) {
    int original = n, reversed = 0;
    while (n > 0) {
        reversed = reversed * 10 + n % 10;
        n /= 10;
    }
    return original == reversed;
}

int main() {
    int a = 12321, b = 1234;
    cout << a << (isPalindromeNumber(a) ? " is" : " is not") << " a palindrome" << endl;
    cout << b << (isPalindromeNumber(b) ? " is" : " is not") << " a palindrome" << endl;
    return 0;
}
