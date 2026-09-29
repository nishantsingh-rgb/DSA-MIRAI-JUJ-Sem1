#include <iostream>
using namespace std;

int main() {
    char ch = 'e';

    bool isVowel = (ch=='a' || ch=='e' || ch=='i' || ch=='o' || ch=='u' ||
                     ch=='A' || ch=='E' || ch=='I' || ch=='O' || ch=='U');

    cout << boolalpha;
    cout << "'" << ch << "' is a vowel: " << isVowel << endl;
    return 0;
}
