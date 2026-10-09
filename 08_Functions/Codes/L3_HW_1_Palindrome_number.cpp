#include <iostream>
using namespace std;

int reverseNumber(int n) {
    int reversed = 0;
    while (n > 0) {
        reversed = reversed * 10 + n % 10;
        n /= 10;
    }
    return reversed;
}

bool isPalindrome(int n) {
    return n == reverseNumber(n);
}

int main() {
    int nums[4] = {121, 4554, 123, 7};
    for (int i = 0; i < 4; i++) {
        cout << nums[i] << " -> " << (isPalindrome(nums[i]) ? "Palindrome" : "Not palindrome") << endl;
    }
    return 0;
}
