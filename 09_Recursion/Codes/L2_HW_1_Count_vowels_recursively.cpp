#include <iostream>
using namespace std;

bool isVowel(char c) {
    if (c >= 'A' && c <= 'Z') c = c + 32;     // make it lowercase
    return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u';
}

int countVowels(string s, int index) {
    if (index == s.length()) return 0;             // reached the end
    int here = isVowel(s[index]) ? 1 : 0;
    return here + countVowels(s, index + 1);
}

int main() {
    string a = "Recursion is Awesome";
    string b = "rhythm";
    cout << "Vowels in \"" << a << "\" = " << countVowels(a, 0) << endl;
    cout << "Vowels in \"" << b << "\" = " << countVowels(b, 0) << endl;
    return 0;
}
