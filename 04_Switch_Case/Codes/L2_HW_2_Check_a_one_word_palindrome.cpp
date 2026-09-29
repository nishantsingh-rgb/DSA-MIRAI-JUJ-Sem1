#include <iostream>
using namespace std;

int main() {
    string word = "madam";
    bool isPalindrome = true;

    int n = word.length();
    for (int i = 0; i < n / 2; i++) {
        if (word[i] != word[n - 1 - i]) {
            isPalindrome = false;
            break;
        }
    }

    cout << boolalpha;
    cout << "\"" << word << "\" is a palindrome: " << isPalindrome << endl;
    return 0;
}
